import { Op } from "sequelize";
import { getUsers } from "../user/crud.js";
import { logger } from "../logger/logger.js";
import { UserInformation } from "../db/pool.js";
import { searchUsersValidation } from "../joi/validation.js";

const FILE_NAME = 'search.js';

export async function searchUsersAPI(body) {

    const userId = body.userId;
    delete body.userId;

    const requestId = body.requestId;
    delete body.requestId;
    
    try {
        
        const { headerError, bodyError } = searchUsersValidation(body);
        if (headerError || bodyError) {
            return {
                statusCode: 400,
                body: {
                    message: 'Oops! Something went wrong.',
                    error: 'Invalid payload ' + (headerError || bodyError.details.map(d => d.message).join('; '))
                }
            }
        }

        const queryObj = {
            persona_type: body.persona_type,
            deleted_at: null,
            email_verified_at: {
                [Op.ne]: null
            },
            id: {
                [Op.ne]: userId
            }
        }

        const includesStatementObj = {
            model: UserInformation,
            attributes: ['name', 'profile_title', 'avatar', 'country'],
            as: 'user_information',
        };

        if (body?.name?.length) {
            includesStatementObj.where = {
                name: {
                    [Op.like]: `%${body.name}%`,
                }
            }
        }

        const userDataFromDB = await getUsers(
            queryObj,
            [includesStatementObj],
            ['id'],
            requestId
        );

        if (userDataFromDB.error) {
            return userDataFromDB.errorData;
        }

        const userData = userDataFromDB.data.users.filter(userData => {
            return userData.user_information
        });

        return {
            statusCode: 200,
            body: {
                message: 'Users found!',
                users: userData
            }
        }

    } catch (error) {
        logger.error(FILE_NAME, 'searchUsersAPI', requestId, {
            error,
            errorMessage: error.message,
            errorStack: error.stack
        });
        return {
            statusCode: 500,
            body: {
                message: 'Could not fetch users from search result!'
            }
        }
    }
}
