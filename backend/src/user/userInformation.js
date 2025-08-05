import { config } from 'dotenv';
import { logger } from '../logger/logger.js';
import { UserInformation } from '../db/pool.js';
import { updateUserInformationValidation } from '../joi/validation.js';
config();

const FILE_NAME = 'userInformation.js';

export async function userInformation(body) {
  
    const userId = body.userId;
    delete body.userId;

    const requestId = body.requestId;
    delete body.requestId;

    try {
        const { headerError, bodyError } = updateUserInformationValidation(body);
        if (headerError || bodyError) {
            return {
                statusCode: 400,
                body: {
                    message: 'Oops! Something went wrong.',
                    error: 'Invalid payload ' + (headerError || bodyError.details.map(d => d.message).join('; '))
                }
            };
        }
    
        const { ...userInfoData } = body;
        const [_, created] = await UserInformation.upsert({
            user_id: userId,
            ...userInfoData
        }, {
            conflictFields: ['user_id']
        });

        return {
            statusCode: 200,
            body: { 
                message: created
                ? 'User Information created!'
                : 'User Information updated!',
            }
        };
    } catch (error) {
        logger.error(FILE_NAME, 'userInformation', requestId, {
            error,
            errorMessage: error.message,
            errorStack: error.stack
        });
        return {
            statusCode: 500,
            body: { 
                message: 'Internal Server Error! Failed to save user information.',
            }
        };
    }
}
