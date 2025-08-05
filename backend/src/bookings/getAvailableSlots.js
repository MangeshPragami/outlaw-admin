//getAvailableSlots.js
import { Op } from "sequelize";
import { config } from "dotenv";
import { getBookings } from "./crud.js";
import { getUser } from "../user/crud.js";
import { logger } from "../logger/logger.js";
import { UserInformation } from "../db/pool.js";
import { BOOKING_STATUSES } from "../helper/constants.js";
import { getWorkingHours } from "../helper/helper.js";
config();

const MAX_BOOKED_TILL_IN_DAYS = +process.env.MAX_BOOKED_TILL_IN_DAYS || 3;
const FILE_NAME = 'getAvailableSlots.js';

export async function getAvailableSlots(body) {
    
    const userId = body.userId;
    delete body.userId;

    const requestId = body.requestId;
    delete body.requestId;
    
    try {
        
        const usersDataFromDB = await getUser(
            { 
                id: userId,
                deleted_at: null
            },
            [
                {
                    model: UserInformation,
                    attributes: ['available_time_slots'],
                }
            ],
            ['id', 'email'],
            requestId
        );
    
        if (usersDataFromDB.error) {
            return usersDataFromDB.errorData;
        }
    
        const usersData = usersDataFromDB.data.user;
        const usersWorkingHours = getWorkingHours(usersData.UserInformation.available_time_slots, requestId);
    
        const availableSlots = [];
    
        const minSlotsCount = MAX_BOOKED_TILL_IN_DAYS >= 7 ? MAX_BOOKED_TILL_IN_DAYS : Math.min(MAX_BOOKED_TILL_IN_DAYS, usersWorkingHours.length);
    
        const now = new Date();
    
        let startDay = now.getDay();
    
        for (let i = 0; i < minSlotsCount; i++) {
            
            startDay += i;
            
            if (startDay > 6) {
                startDay = startDay % 7;
            }
            
            for (const workingHoursObj of usersWorkingHours) {
                if (workingHoursObj.day === startDay) {
                    availableSlots.push(workingHoursObj);
                }
            }
        }
    
        if (!availableSlots.length) {
            return {
                statusCode: 200,
                body: {
                    availableSlots: []
                }
            }
        }
    
        const startTimeForDB = getTimeStampForDataBase(now.getTime());
        const endTimeForDB = getTimeStampForDataBase(now.getTime() + MAX_BOOKED_TILL_IN_DAYS * 24 * 60 * 60 * 1000);
    
        const existingBookings = await getBookings(
            {
                [Op.or]: {
                    creator_id: body.userId,
                    participant_id: body.userId
                },
                start_time: {
                    [Op.gte]: startTimeForDB
                },
                end_time: {
                    [Op.lte]: endTimeForDB
                },
                status: [BOOKING_STATUSES.ONGOING, BOOKING_STATUSES.SCHEDULED, BOOKING_STATUSES.COMPLETED, BOOKING_STATUSES.PENDING]
            },
            requestId
        );

        if (existingBookings.error) {
            if (existingBookings.errorData.statusCode === 404) {
                return {
                    statusCode: 200,
                    body: {
                        availableSlots
                    }
                }
            }
            return existingBookings.errorData;
        }

        const bookings = existingBookings.data.bookings;
    
        // Logic for removing conflicting times
        for (const booking of bookings) {
            
            const bookingStartTime = new Date(booking.start_time);
            const bookingEndTime = new Date(booking.end_time);

            for (const { day, times } of availableSlots) {
                if (bookingStartTime.getDay() === day || bookingEndTime.getDay() === day) {
                    
                }
            }
        }
    
        if (!availableSlots.length) {
            return {
                statusCode: 200,
                body: {
                    availableSlots: []
                }
            }
        }
    
        return {
            statusCode: 200,
            body: {
                availableSlots
            }
        }
    } catch (error) {
        logger.error(FILE_NAME, 'getAvailableSlots', requestId, {
            error,
            errorMessage: error.message,
            errorStack: error.stack
        });
        return {
            statusCode: 500,
            body: {
                message: 'Cannot fetch users available slots!'
            }
        }
    }
}