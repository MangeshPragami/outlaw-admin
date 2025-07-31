import { getUser } from "../user/crud.js";
import { logger } from "../logger/logger.js";
import { UserInformation } from "../db/pool.js";

const FILE_NAME = 'getUser.js';

export async function getUserDetails(body) {

    const userId = body.userId;
    delete body.userId;

    const requestId = body.requestId;
    delete body.requestId;
    
    try {

        if (!body.user_id) {
            throw new Error('user id is missing');
        }
        
        const userDataFromDB = await getUser(
            {
                id: body.user_id,
                deleted_at: null
            },
            [
                {
                    model: UserInformation,
                    attributes: {
                        exclude: ['updated_at', 'created_at', 'id'],
                    },
                    as: 'user_information',
                }
            ],
            ['id', 'persona_type'],
            requestId
        );

        if (userDataFromDB.error) {
            return userDataFromDB.errorData
        }

        const userData = userDataFromDB.data.user;

        return {
            statusCode: 200,
            body: {
                userData
            }
        };
    } catch (error) {
        logger.error(FILE_NAME, 'getUserDetails', requestId, {
            error,
            errorMessage: error.message,
            errorStack: error.stack
        });
        return {
            statusCode: 500,
            body: {
                message: 'Could not fetch user!'
            }
        }
    }
}