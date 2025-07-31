import { config } from 'dotenv';
import { getUser } from '../user/crud.js';
import { logger } from '../logger/logger.js';
config();

const FILE_NAME = 'getUserConsent.js';

export async function getUserConsent(body) {

    const userId = body.userId;
    delete body.userId;

    const requestId = body.requestId;
    delete body.requestId;
    
    try {

        if (!userId) {
            return {
                statusCode: 200,
                body: {
                    message: 'userId is missing',
                }
            }
        }
        
        const userDataFromDB = await getUser(
            {
                id: userId,
                deleted_at: null
            },
            null,
            ['consented_at'],
            requestId
        );

        if (userDataFromDB.error) {
            return userDataFromDB.errorData;
        }

        return {
            statusCode: 200,
            message: 'Success',
            body: {
                constentTaken: (userDataFromDB.data.user.consented_at || '').toString().length > 0
            }
        }
    } catch (error) {
        logger.error(FILE_NAME, 'getUserConsent', requestId, {
            error,
            errorMessage: error.message,
            errorStack: error.stack
        });
        return {
            statusCode: 500,
            body: {
                message: 'Internal Server Error! Could not get user consent.'
            }
        }
    }
}
