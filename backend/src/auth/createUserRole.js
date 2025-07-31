import { config } from 'dotenv';
import { getUser, updateUser } from '../user/crud.js';
import { logger } from '../logger/logger.js';
import { USER_ROLES } from "../helper/constants.js";
import { userRoleValidation } from '../joi/validation.js';
config();

const FILE_NAME = 'createUserRole.js';

export async function createUserRole(body) {

    const userId = body.userId;
    delete body.userId;

    const requestId = body.requestId;
    delete body.requestId;

    try {
        const { headerError, bodyError } = userRoleValidation(body);
        if (headerError || bodyError) {
            return {
                statusCode: 400,
                body: {
                    message: 'Oops! Something went wrong.',
                    error: 'Invalid payload ' + (headerError || bodyError.details.map(d => d.message).join('; '))
                }
            }
        }
    
        const { role } = body;

        const user = await getUser(
            {
                id: userId,
                deleted_at: null
            },
            null,
            ['id', 'persona_type'],
            requestId
        );

        if (user.persona_type && user.persona_type !== USER_ROLES.NOT_SELECTED) {
            return {
                statusCode: 409,
                body: {
                    message: 'User role has already been set. Cannot update it again.'
                }
            };
        }

        const updateUserResponse = await updateUser(
            {
                id: userId
            },
            {
                persona_type: role
            },
            requestId
        )

        if (updateUserResponse.error) {
            return updateUserResponse.errorData;
        }

        return {
            statusCode: 200,
            message: 'Success',
        }
    } catch (error) {
        logger.error(FILE_NAME, 'createUserRole', requestId, {
            error,
            errorMessage: error.message,
            errorStack: error.stack
        });
        return {
            statusCode: 500,
            body: {
                message: 'Internal Server Error! Could not create user role.'
            }
        }
    }
}
