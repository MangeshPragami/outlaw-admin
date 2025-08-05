
import {createBooking} from "../../bookings/crud.js";
import {getUsers} from "../../user/crud.js";
import {logger} from "../../logger/logger.js";

const FILE_NAME = 'admin/create.js';

export async function createBookingAdmin(body) {

    console.log('Create Booking.')

    const requestId = body.requestId;
    delete body.requestId;

    try {
        const {creatorId, participantId, startTime, endTime} = body;

        // Fetch attendees from users table using creator_id and participant_id
        const userIds = [creatorId, participantId];
        const usersResult = await getUsers(
            { id: userIds },
            null,
            null,
            requestId
        );

        if (usersResult.error) {
            return usersResult.errorData;
        }

        if (!usersResult.error && usersResult.data?.users) {
            if(usersResult.data?.users.length !== 2){
                throw new Error('Meeting Cant be generated');
            }
        }

        // Create new booking
        const bookingData = {
            creator_id: creatorId,
            participant_id: participantId,
            start_time: startTime,
            end_time: endTime,
            status: 'scheduled',
        };

        const bookingResponse = await createBooking(bookingData, requestId);
        if (bookingResponse.error) {
            throw new Error('Failed to create booking with meeting details');
        }

        // @todo send mail to creator and participant about upcoming meeting, and each-other's information.
        // to send an email call lambda function for sending an Email.
        return {
            statusCode: 200,
            body: bookingResponse
        };
    } catch (error) {
        logger.error(FILE_NAME, 'createBookingAdmin', requestId, {
            error,
            errorMessage: error.message,
            errorStack: error.stack
        });
        return {
            statusCode: 500,
            body: {
                message: 'Could not create meeting'
            }
        }
    }
}

