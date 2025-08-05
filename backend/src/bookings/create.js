import { Op } from "sequelize";
import { config } from "dotenv";
import { getUsers } from "../user/crud.js";
import { logger } from "../logger/logger.js";
import { createBooking, getBookings } from "./crud.js";
import { cache, UserInformation } from "../db/pool.js";
import { BOOKING_STATUSES } from "../helper/constants.js";
import { createBookingValidation } from "../joi/validation.js";
import { getBookingCreatorCacheKey, getBookingParticipantCacheKey, getTimeStampForDataBase, getWorkingHours } from "../helper/helper.js";
config();

const MEETING_DURATION_IN_MINUTES = +process.env.MEETING_DURATION_IN_MINUTES || 30;
const MAX_BOOKED_TILL_IN_DAYS = +process.env.MAX_BOOKED_TILL_IN_DAYS || 3;
const BOOKING_MUTEX_EXPIRES_IN_SECONDS = +process.env.BOOKING_MUTEX_EXPIRES_IN_SECONDS || 90;

const FILE_NAME = 'create.js';

function validateTimes(body, nowTimeStamp, availableSlotsPerUser) {

    const epochStartTime = body.startTime;
    const epochEndTime = body.endTime;

    function validateTime(timestamp) {
        
        if (!timestamp) return false; 
        
        /*
        Rules:
            - Booking must be within working days and within workig hours, applicable to both creator and participant.
            - Default Booking Schedule is Mon - Fri, 9:00 till 17:00.
                - Meetings can only end at 5:00 pm and not start at 5:00pm
            - Meetngs will be in MEETING_DURATION_IN_MINUTES minutes intervals, that means minutes must be a multiple of MEETING_DURATION_IN_MINUTES.
            - Meetings must be greater than current time stamp.
            - Meetings must be less than MAX_BOOKED_TILL_IN_DAYS days into the future.
            - Seconds are not considered, to avoid edge case of booking with different seconds same timestamps.
        */  
       
        const date = new Date(timestamp);

        if (isNaN(date.getTime())) return false;

        const dayFromTimeStamp = date.getDay();
        const hours = date.getHours();
        const minutes = date.getMinutes();

        // Past time stamps not allowed
        if (date.getTime() <= nowTimeStamp.getTime()) {
            return {
                error: true,
                errorData: {
                    statusCode: 400,
                    body: {
                        message: 'Start Time and End Time must be a value in the future!',
                    }
                }
            }
        }

        // Future timestamps past MAX_BOOKED_TILL_IN_DAYS days, not allowed.
        if (date.getTime() >= date.getTime() + MAX_BOOKED_TILL_IN_DAYS * 24 * 60 * 60 * 1000) {
            return {
                error: true,
                errorData: {
                    statusCode: 400,
                    body: {
                        message: 'Cannot Book past set limits!',
                    }
                }
            }
        }

        // Checking for multiples of MEETING_DURATION_IN_MINUTES

        const bookingDurationMultiplesInMinutes = [];
        for (let i = 0; i < Math.ceil(60 / MEETING_DURATION_IN_MINUTES); i++) {
            if (i * MEETING_DURATION_IN_MINUTES < 60) {
                bookingDurationMultiplesInMinutes.push(i * MEETING_DURATION_IN_MINUTES);
            }
        }

        if (!bookingDurationMultiplesInMinutes.includes(minutes)) {
            return {
                error: true,
                errorData: {
                    statusCode: 400,
                    body: { message: 'Invalid meeting time format!' }
                }
            };
        }

        // Validating all users available slots
        for (const { availableTimeSlots, userId } of availableSlotsPerUser) {
            let canContinueBooking = false;
            outerLoop: for (const { day, times } of availableTimeSlots) {
                if (day === dayFromTimeStamp) {
                    for (const workingHours of times) {                        
                        if (
                            (hours <= workingHours.endTime.hours && minutes <= workingHours.endTime.minutes) &&
                            (hours >= workingHours.startTime.hours && minutes >= workingHours.startTime.hours)
                        ) {
                            canContinueBooking = true;
                            break outerLoop;
                        }
                    }
                }
            }
            
            if (!canContinueBooking) {
                return {
                    error: true,
                    errorData: {
                        statusCode: 400,
                        body: { 
                            message: 
                                userId === body.creatorId ?
                                    'Meeting cannot be created outside your working days/hours! Please update your work schedule' :
                                    'Meeting cannot be created outside working days/hours of participants!'
                        }
                    }
                };
            }
        }

        return {
            error: false,
            errorData: {}
        }; 
    }

    const startTimeValidation = validateTime(epochStartTime);
    if (startTimeValidation.error) {
        return startTimeValidation;
    }

    const endTimeValidation = validateTime(epochEndTime);
    if (endTimeValidation.error) {
        return endTimeValidation;
    }

    const formattedStartTime = new Date(epochStartTime).getTime();
    const formattedEndTime = new Date(epochEndTime).getTime();
    
    if (formattedStartTime >= formattedEndTime) {
        return {
            error: true,
            errorData: {
                statusCode: 400,
                body: {
                    message: 'Start Time must be before End Time!',
                }
            }
        }
    }

    if (formattedEndTime - formattedStartTime !== MEETING_DURATION_IN_MINUTES * 60 * 1000) {
        return {
            error: true,
            errorData: {
                statusCode: 400,
                body: {
                    message: 'Meeting duration cannot exceed 30 minutes',
                }
            }
        }
    }

    return { error: false, errorData: {} };

}

async function validateCache(body, requestId) {
    try {
        /* 
            System Design:
                Bookings can only take place between 2 users at once.
                There will be a creator and a participant in the meeting.
                Concurrent Booking Cases:
                                        
                    Users: A, B, C
                    Time Slot: 10:00 am to 10:30 am

                    All are trying to book each other in the same slots.
                    
                    Case 1: 
                        User A (creator) -> User B (participant)
                        User C (creator) -> User B (participant)
                    
                    Expected Outcome:
                        The user who attains the lock on participant B first, gets to book.
                    
                    Reasoning:
                        Avoid duplicate bookings in the same time interval.
                    
                    Case 2:
                        User A (creator) -> User B (participant)
                        User C (creator) -> User A (participant)
                    
                    Expected Outcome:
                        User C will not be able to book, since User A is creating their own booking with user B.
                        
                    Reasoning:
                        If User C was allowed to book, then on User A's dashboard they will be shown 2 meetings for the same interval
                        User A -> User B (pending), awaiting User A's confirmation.
                        User C -> User A (scheduled), accept / reject this meet. This makes no sense, User A would ideally delete this, since they have set their own meeting with User B.
                        Irrespective of User A's action(accept/reject), User A has shown intent to create a meeting and must therfore be marked as occupied for that slot.

                    Case 3:
                        User C (creator) -> User A (participant)
                        User A (creator) -> User B (participant)

                    Expected Outcome:
                        User C will be able to book meeting with User A.
                        User A will be able to book meeting with user B.
                        User A will be shown User C's meeting request on their dashboard.
                    
                    Reasoning:
                        This case is the same as Case 2, but the order has switched.
                        Since User C's request was processed first, technically User A is not yet marked as booked. Hence User C is allowed to book a meeting with User A.
                        User A will be shown the option to either accept or reject the meeting.
                    
                    Case 4:
                        User C (creator) -> User A (participant) (web/android/ios platform)
                        User C (creator) -> User A (participant) (web/android/ios platform)
                    
                    Expected Outcome:
                        User C will be able to book meeting with User A once only.
                    
                    Reasoning:
                        User C is trying to book a meeting with User A using multiple devices/platforms
                        They could have duplicated the booking tabs on the browser, or are logged in on multiple devices etc.
                        Here the User should be allowed only 1 booking with the participant.      

                    Case 5: This case is not handled correctly yet, the outcome here would be that both users will see 2 meetings, one they created the other created by the other user.
                        User C (creator) -> User A (participant)
                        User A (creator) -> User C (participant)
                    
                    Expected Outcome:
                        Same as Case 1, the first request that locks participant gets the booking.
                        The other creator should not be allowed to create that booking.
                    
                    Reasoning:
                        If circular bookings are allowed, then both users will be shown 2 meetings.
                        One created by them, the other for them to accept.
                        This is undesirable.
        */

        const { creatorId, participantId, startTime } = body;
    
        const creatorCacheKey = getBookingCreatorCacheKey(creatorId, startTime);
        const participantCacheKey = getBookingParticipantCacheKey(participantId, startTime);
        const participantAsCreatorCacheKey = getBookingCreatorCacheKey(participantId, startTime);

        const promiseArr = [
            // Checking if participant is creating their own meeting
            cache.get(participantAsCreatorCacheKey),
            // Marking creator as occupied, if already marked then don't allow them to create this booking
            cache.set(creatorCacheKey, true, 'NX', 'EX', BOOKING_MUTEX_EXPIRES_IN_SECONDS),
            // Marking creator as occupied, if already marked then don't allow them to create this booking
            cache.set(participantCacheKey, true, 'NX', 'EX', BOOKING_MUTEX_EXPIRES_IN_SECONDS)
        ];
    
        const [
            participantAsCreatorCacheData,
            creatorSetCacheResponse, 
            participantSetCacheResponse
        ] = await Promise.allSettled(promiseArr);

        // If cache cannot be validated, then don't allow booking.
        if (
            participantAsCreatorCacheData.status === 'rejected' || 
            creatorSetCacheResponse === 'rejected' || 
            participantSetCacheResponse.status === 'rejected'
        ) {
            await cache.del(creatorCacheKey, participantCacheKey);
            return false;
        }
    
        // If the NX operation fails or the participant is trying to create their own meeting, that means one of the members already has a lock. In that case bookings must not be allowed.
        if (
            // This checks if the participant is trying to create a meeting with someone else in the same duration, if yes then disallow the meeting where this user is being treated as a participant from being created.
            (
                participantAsCreatorCacheData.status === 'fulfilled' &&
                Boolean(participantAsCreatorCacheData.value) === true
            ) ||
            // This checks if creator is logged in via multiple devices and is trying to create the same meeting multiple times.
            (
                creatorSetCacheResponse.status === 'fulfilled' &&
                creatorSetCacheResponse.value !== 'OK'
            ) ||
            // This checks if the participant is being actively locked in some other booking, disallows creator from creating booking with this participant in this time slot
            (
                participantSetCacheResponse.status === 'fulfilled' &&
                participantSetCacheResponse.value !== 'OK'
            )
        ) {
            await cache.del(creatorCacheKey, participantCacheKey);
            return false;
        }

        return true;
    } catch (error) {
        // If cache cannot be validated, then don't allow booking.
        logger.error(FILE_NAME, 'validateCache', requestId, {
            error,
            errorMessage: error.message,
            errorStack: error.stack
        });
        return false;
    }
}

export async function createBookingAPI(body) {
    console.log('createBookingAPI::body::',body)
    const requestId = body.requestId;
    const currentUser = body.userId;
    delete body.requestId;
    delete body.userId;

    try {

        const now = new Date();
        const { headerError, bodyError } = createBookingValidation(body);
        if (headerError || bodyError) {
            return {
                statusCode: 400,
                body: {
                    message: 'Oops! Something went wrong.',
                    error: 'Invalid payload ' + (headerError || bodyError.details.map(d => d.message).join('; '))
                }
            }
        }
    
        if (body.participantId == body.creatorId) {
            return {
                statusCode: 400,
                body: {
                    message: 'Creator and Participant ids cannot be same!',
                }
            }
        }
    
        const usersDataFromDB = await getUsers(
            { 
                id: { 
                    [Op.in]: [ body.creatorId, body.participantId ] 
                },
                deleted_at: null
            }, 
            [
                {
                    model: UserInformation,
                    attributes: {
                        // exclude: ['available_time_slots'],
                    },
                    as: 'user_information'
                }
            ],
            ['id'],
            requestId
        );
        
        const usersData = usersDataFromDB.data.users;

        if (usersData.length !== 2) {
            return {
                statusCode: 400,
                body: {
                    message: 'Users data inconsistencies!',
                }
            }
        }
        
        const userIdsFromDb = usersData.map((userData) => userData.id);
        const availableSlotsPerUser = [];
        
        for (const userData of usersData) {
            availableSlotsPerUser.push({
                userId: userData.id, 
                availableTimeSlots: getWorkingHours(userData['user_information.available_time_slots'], requestId)
            });
        }
        
        if (!userIdsFromDb.includes(body.creatorId)) {
            return {
                statusCode: 404,
                body: {
                    message: 'Invalid creator id!',
                }
            }
        } else if (!userIdsFromDb.includes(body.participantId)) {
            return {
                statusCode: 404,
                body: {
                    message: 'Invalid participant id!',
                }
            }
        }
    
        const { error, errorData } = validateTimes(body, now, availableSlotsPerUser);
    
        if (error) {
            return errorData;
        }
    
        // Cache key will only consider time without seconds to avoid re-booking in same time interval but different seconds or milliseconds
        body.startTime = Math.floor(new Date(body.startTime).getTime() / (60 * 1000)) * (60 * 1000);
        body.endTime = Math.floor(new Date(body.endTime).getTime() / (60 * 1000)) * (60 * 1000);
    
        // cache layer check
        const participantCacheCheck = await validateCache(body, requestId);
    
        if (!participantCacheCheck) {
            return {
                statusCode: 409,
                body: {
                    message: 'Another booking is in-progress, for the selected time interval. Please choose a different time slot!',
                }
            }
        }
    
        // Finding existing bookings, for mentioned start and end time range, where either the creator or participant is already having a confirmed/ongoing meeting.
        const existingBookings = await getBookings(
            {
                [Op.or]: {
                    creator_id: {
                        [Op.in]: [body.creatorId, body.participantId],
                    },
                    participant_id: {
                        [Op.in]: [body.creatorId, body.participantId],
                    },
                },
                start_time: {
                    [Op.gte]: getTimeStampForDataBase(body.startTime)
                },
                end_time: {
                    [Op.lte]: getTimeStampForDataBase(body.endTime)
                },
                status: [BOOKING_STATUSES.ONGOING, BOOKING_STATUSES.SCHEDULED, BOOKING_STATUSES.COMPLETED, BOOKING_STATUSES.PENDING]
            },
            null,
            requestId
        );
    
        if (existingBookings.error) {
            if (existingBookings.errorData?.statusCode !== 404) {
                return existingBookings.errorData;
            }
        } else if (existingBookings.data.bookings.length) {
            return {
                statusCode: 409,
                body: {
                    message: 'Booking exists in specified time slot! Please choose a different time slot.'
                }
            }
        }
    
        const bookingDetails = await createBooking(
            {
                creator_id: body.creatorId,
                participant_id: body.participantId,
                start_time: getTimeStampForDataBase(body.startTime),
                end_time: getTimeStampForDataBase(body.endTime),
                status: BOOKING_STATUSES.PENDING
            },
            requestId
        );

        if (bookingDetails.error) {
            return bookingDetails.errorData;
        }

        const creatorCacheKey = getBookingCreatorCacheKey(body.creatorId, body.startTime);
        const participantCacheKey = getBookingParticipantCacheKey(body.participantId, body.startTime);   
        
        // releaseing lock once booking is created
        try {
            await cache.del(creatorCacheKey, participantCacheKey);
        } catch (error) {
            // do nothing, even if cache is not cleared, the booking has been created. 
            // Any further attempts to book in the same duration must be blocked, since the cache is not cleared, it will act as a guard till it's TTL is not expired.
        }
    
        return {
            statusCode: 201,
            body: {
                message: 'Success!',
                data: {
                    bookingId: bookingDetails.id
                }
            }
        }
    } catch (error) {

        logger.error(FILE_NAME, 'createBookingAPI', requestId, {
            error,
            errorMessage: error.message,
            errorStack: error.stack
        });
        return {
            error: true,
            errorData: {
                statusCode: 500,
                body: {
                    message: 'Oops something went wrong! Could not create booking.'
                }
            }
        }
    }

}
