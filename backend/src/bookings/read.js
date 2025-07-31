import { Op } from "sequelize";
import { logger } from "../logger/logger.js";
import { getBooking, getBookings } from "./crud.js";
import { getBookingsValidation, getBookingValidation } from "../joi/validation.js";
import { User, UserInformation } from "../db/pool.js";

const FILE_NAME = 'read.js';

export async function getBookingsAPI(body) {

    const userId = body.userId;
    delete body.userId;

    const requestId = body.requestId;
    delete body.requestId;
    
    try {
        // const { headerError, bodyError } = getBookingsValidation(body);
        // if (headerError || bodyError) {
        //     return {
        //         statusCode: 400,
        //         body: {
        //             message: 'Oops! Something went wrong.',
        //             error: 'Invalid payload ' + (headerError || bodyError.details.map(d => d.message).join('; '))
        //         }
        //     }
        // }
    
        const bookingDetailsFromDB = await getBookings(
            {
                [Op.or]: {
                    creator_id: userId,
                    participant_id: userId
                }
            },
            null, // We'll get all fields since we need them for the associations
            requestId,
            [
                {
                    model: User,
                    as: 'creator',
                    attributes: ['id', 'email', 'persona_type'],
                    include: [{
                        model: UserInformation,
                        as: 'user_information',
                        attributes: ['name', 'avatar', 'profile_title', 'country', 'description']
                    }]
                },
                {
                    model: User,
                    as: 'participant',
                    attributes: ['id', 'email', 'persona_type'],
                    include: [{
                        model: UserInformation,
                        as: 'user_information',
                        attributes: ['name', 'avatar', 'profile_title', 'country', 'description']
                    }]
                }
            ]
        );
        
        if (bookingDetailsFromDB.error) {
            return bookingDetailsFromDB.errorData;
        }

        const bookingDetails = bookingDetailsFromDB.data.bookings;
    
        return {
            statusCode: 200,
            body: {
                bookingDetails: bookingDetails.map((data) => {
                    const isCreator = data.creator_id === userId;
                    // Get the other user's info (either creator or participant, whichever isn't current user)
                    const otherUser = isCreator ? data.participant : data.creator;
                    const otherUserInfo = otherUser?.user_information;

                    return {
                        id: data.id,
                        status: data.status,
                        userType: isCreator ? 'creator' : 'participant',
                        startTime: data.start_time,
                        endTime: data.end_time,
                        otherUser: otherUserInfo ? {
                            id: otherUser.id,
                            name: otherUserInfo.name,
                            avatar: otherUserInfo.avatar,
                            profileTitle: otherUserInfo.profile_title,
                            country: otherUserInfo.country,
                            description: otherUserInfo.description,
                            personaType: otherUser.persona_type
                        } : null
                    }
                })
            }
        }
    } catch (error) {
        logger.error(FILE_NAME, 'getBookingsAPI', requestId, {
            error,
            errorMessage: error.message,
            errorStack: error.stack
        });
        return {
            statusCode: 500,
            body: {
                message: 'Could not fetch bookings'
            }
        }
    }
}

export async function getBookingAPI(body) {
    
    const userId = body.userId;
    delete body.userId;

    const requestId = body.requestId;
    delete body.requestId;
    
    try {
        const { headerError, bodyError } = getBookingValidation(body);
        if (headerError || bodyError) {
            return {
                statusCode: 400,
                body: {
                    message: 'Oops! Something went wrong.',
                    error: 'Invalid payload ' + (headerError || bodyError.details.map(d => d.message).join('; '))
                }
            }
        }
    
        const bookingDetailsFromDB = await getBooking(
            { 
                id: body.bookingId,  
                [Op.or]: {
                    creator_id: userId,
                    participant_id: userId
                }
            },
            null,
            requestId,
            [
                {
                    model: User,
                    as: 'creator',
                    attributes: ['id', 'email', 'persona_type'],
                    include: [{
                        model: UserInformation,
                        as: 'user_information',
                        attributes: ['name', 'avatar', 'profile_title', 'country', 'description']
                    }]
                },
                {
                    model: User,
                    as: 'participant',
                    attributes: ['id', 'email', 'persona_type'],
                    include: [{
                        model: UserInformation,
                        as: 'user_information',
                        attributes: ['name', 'avatar', 'profile_title', 'country', 'description']
                    }]
                }
            ]
        );
        
        if (bookingDetailsFromDB.error) {
            return bookingDetailsFromDB.errorData;
        }

        const bookingDetails = bookingDetailsFromDB.data.booking;
        const isCreator = bookingDetails.creator_id === userId;
        const otherUser = isCreator ? bookingDetails.participant : bookingDetails.creator;
        const otherUserInfo = otherUser?.user_information;
    
        return {
            statusCode: 200,
            body: {
                bookingDetails: {
                    id: bookingDetails.id,
                    status: bookingDetails.status,
                    userType: isCreator ? 'creator' : 'participant',
                    startTime: bookingDetails.start_time,
                    endTime: bookingDetails.end_time,
                    otherUser: otherUserInfo ? {
                        id: otherUser.id,
                        name: otherUserInfo.name,
                        avatar: otherUserInfo.avatar,
                        profileTitle: otherUserInfo.profile_title,
                        country: otherUserInfo.country,
                        description: otherUserInfo.description,
                        personaType: otherUser.persona_type
                    } : null
                }
            }
        }
    } catch (error) {
        logger.error(FILE_NAME, 'getBookingsAPI', requestId, {
            error,
            errorMessage: error.message,
            errorStack: error.stack
        });
        return {
            statusCode: 500,
            body: {
                message: 'Could not fetch booking'
            }
        }
    }
}