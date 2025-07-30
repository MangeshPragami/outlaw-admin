import { Booking } from "../db/pool.js";
import { logger } from "../logger/logger.js";
import { DB_ERRORS } from "../helper/constants.js";
import { Op } from "sequelize";

const FILE_NAME = 'bookings/crud.js';

export async function getBooking(where, attributes, requestId, includes = []) {
    try {
        if (!where) {
            throw DB_ERRORS.DB_01;
        }

        const queryObj = {
            where,
            raw: false,
            nest: true
        }

        if (attributes && attributes.length) {
            queryObj.attributes = attributes;
        }

        if (includes.length > 0) {
            queryObj.include = includes;
        }

        const booking = await Booking.findOne(queryObj)

        if (!booking) {
            return {
                error: true,
                errorData: {
                    statusCode: 404,
                    body: {
                        message: 'Booking not found.'
                    }
                }
            }
        }

        return {
            error: false,
            data: {
                booking
            }
        }
    } catch (error) {
        logger.error(FILE_NAME, 'getBooking', requestId, {
            error,
            errorMessage: error.message,
            errorStack: error.stack
        });
        return {
            error: true,
            errorData: {
                statusCode: 500,
                body: {
                    message: 'Could not fetch booking'
                }
            }
        }
    }
}

export async function getBookings(where, attributes, requestId, includes = [], sortObj = [['start_time', 'DESC']]) {
    try {
        if (!where) {
            throw DB_ERRORS.DB_01;
        }

        const queryObj = {
            where,
            raw: false, // Set to false to get model instances with associations
            nest: true  // Nest the associated models
        }

        if (attributes && attributes.length) {
            queryObj.attributes = attributes;
        }

        if (includes.length > 0) {
            queryObj.include = includes;
        }

        if(sortObj.length > 0 ){
            queryObj.order =  sortObj;
        }

        const bookings = await Booking.findAll(queryObj)

        if (!bookings || !bookings.length) {
            return {
                error: true,
                errorData: {
                    statusCode: 404,
                    body: {
                        message: 'Bookings not found.'
                    }
                }
            }
        }

        return {
            error: false,
            data: {
                bookings
            }
        }
    } catch (error) {
        logger.error(FILE_NAME, 'getBookings', requestId, {
            error,
            errorMessage: error.message,
            errorStack: error.stack
        });
        return {
            error: true,
            errorData: {
                statusCode: 500,
                body: {
                    message: 'Could not fetch bookings'
                }
            }
        }
    }
}

export async function createBooking(data, requestId) {
    try {
console.log('createBooking', data)
        const createBookingResponse = await Booking.create(data);
        const plainData = createBookingResponse.get({ plain: true });

        if (!plainData || !plainData.id) {
            return {
                error: true,
                errorData: {
                    statusCode: 404,
                    body: {
                        message: 'Bookings could not be created.'
                    }
                }
            }
        }

        return {
            error: false,
            data: {
                bookingResponse: plainData
            }
        }
    } catch (error) {
        logger.error(FILE_NAME, 'createBooking', requestId, {
            error,
            errorMessage: error.message,
            errorStack: error.stack
        });
        return {
            error: true,
            errorData: {
                statusCode: 500,
                body: {
                    message: 'Could not create booking'
                }
            }
        }
    }
}

export async function updateBooking(where, data, requestId) {
    try {

        if (!where) {
            throw DB_ERRORS.DB_01;
        }

        if (!data.updated_at) {
            data.updated_at = new Date().toISOString();
        }

        const [affectedCount, affectedRows] = await Booking.update(
            data,
            {
                where,
                returning: true,
                raw: true
            }
        )

        if (affectedCount === 0 || !Object.keys(affectedRows[0] || {}).length) {
            return {
                error: true,
                errorData: {
                    statusCode: 404,
                    body: {
                        message: 'Bookings could not be updated.'
                    }
                }
            }
        }

        return {
            error: false,
            data: {
                bookingResponse: affectedRows[0]
            }
        }
    } catch (error) {
        logger.error(FILE_NAME, 'updateBooking', requestId, {
            error,
            errorMessage: error.message,
            errorStack: error.stack
        });
        return {
            error: true,
            errorData: {
                statusCode: 500,
                body: {
                    message: 'Could not update booking'
                }
            }
        }
    }
}