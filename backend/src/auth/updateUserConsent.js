import { config } from 'dotenv';
import { logger } from '../logger/logger.js';
import { getUser, updateUser } from '../user/crud.js';
import { getTimeStampForDataBase } from '../helper/helper.js';
config();

const FILE_NAME = 'updateUserConsent.js';

export async function updateUserConsent(body) {

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

        if ((userDataFromDB.data.user.consented_at || '').toString().length > 0) {
            return {
                statusCode: 200,
                message: 'Consent already taken',
                body: {
                    constentTaken: true
                }
            }
        }

        const updateUserResponse = await updateUser(
            { id: userId },
            {
                consented_at: getTimeStampForDataBase(new Date())
            },
            requestId
        )

        if (updateUserResponse.error) {
            return updateUserResponse.errorData;
        }

        return {
            statusCode: 200,
            message: 'Success',
            body: {
                constentTaken: (updateUserResponse.data.userResponse.consented_at || '').toString().length > 0
            }
        }
    } catch (error) {
        logger.error(FILE_NAME, 'updateUserConsent', requestId, {
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
