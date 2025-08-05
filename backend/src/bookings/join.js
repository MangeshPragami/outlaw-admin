//join.js
import {Op} from "sequelize";
import {getBooking} from "./crud.js";
import {logger} from "../logger/logger.js";
const FILE_NAME = 'join.js';;

export async function joinMeeting(body) {
    const userId = body.userId;
    delete body.userId;

    const requestId = body.requestId;
    delete body.requestId;

    try {
        const currentTime = new Date();
        const userData = userDataFromDB.data.user;
    
        const bookingDetailsFromDB = await getBooking(
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
        
        if (bookingDetailsFromDB.error) {
            return bookingDetailsFromDB.errorData;
        }

        const bookingDetails = bookingDetailsFromDB.data.booking;
    } catch (error) {
        logger.error(FILE_NAME, 'joinMeeting', requestId, {
            error,
            errorMessage: error.message,
            errorTrace: error.trace
        });

        return {
            stautsCode: 500,
            body: {
                message: 'Internal Server Error! Cannot Join meeting, please retry later.'
            }
        }
    }
}
