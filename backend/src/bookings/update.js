//update.js
import { Op } from "sequelize";
import { getUser } from "../user/crud.js";
import { logger } from "../logger/logger.js";
import { getBooking, updateBooking } from "./crud.js";
import { BOOKING_STATUSES } from "../helper/constants.js";
import { updateBookingValidation } from "../joi/validation.js";

const FILE_NAME = 'update.js';

export async function updateBookingAPI(body) {
    
    const userId = body.userId;
    delete body.userId;

    const requestId = body.requestId;
    delete body.requestId;
    
    try {
        
        const { headerError, bodyError } = updateBookingValidation(body);
        if (headerError || bodyError) {
            return {
                statusCode: 400,
                body: {
                    message: 'Oops! Something went wrong.',
                    error: 'Invalid payload ' + (headerError || bodyError.details.map(d => d.message).join('; '))
                }
            }
        }

        const userDataFromDB = await getUser(
            { 
                id: userId,
                deleted_at: null
            },
            null,
            ['id', 'email'],
            requestId
        );

        if (userDataFromDB.error) {
            return userDataFromDB.errorData;
        }

        const userData = userDataFromDB.data.user;

        const existingBooking = await getBooking(
            {
                id: body.bookingId,
                [Op.or]: {
                    creator_id: userData.id,
                    participant_id: userData.id
                }
            },
            ['id', 'creator_id', 'participant_id', 'status', 'start_time', 'end_time'],
            requestId
        );

        if (existingBooking.error) {
            return existingBooking.errorData;
        }

        const bookingData = existingBooking.data.booking;

        if (bookingData.participant_id === userData.id) {
            if (![BOOKING_STATUSES.DECLINED, BOOKING_STATUSES.SCHEDULED].includes(body.status)) {
                return {
                    statusCode: 400,
                    body: {
                        message: 'Invalid operation for participant'
                    }
                }
            }
        } else if (bookingData.creator_id === userData.id) {
            if (BOOKING_STATUSES.CANCELLED !== body.status) {
                return {
                    statusCode: 400,
                    body: {
                        message: 'Invalid operation for creator'
                    }
                }
            }
        }

        const updateBookingResponse = await updateBooking(
            {
                bookingId: body.bookingId
            },
            {
                status: body.status
            },
            requestId
        );

        if (updateBookingResponse.error) {
            return updateBookingResponse.errorData;
        }

        return {
            statusCode: 200,
            body: {
                message: 'Booking status updated!'
            }
        }

    } catch (error) {
        logger.error(FILE_NAME, 'updateBookingAPI', requestId, {
            error,
            errorMessage: error.message,
            errorStack: error.stack
        });
        return {
            statusCode: 500,
            body: {
                message: 'Unable to update booking!'
            }
        }
    }
}