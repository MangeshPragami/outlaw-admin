import { config } from 'dotenv';
import { getUser } from './crud.js';
import { logger } from '../logger/logger.js';
import { Idea, UserInformation } from '../db/pool.js';
import {Op} from "sequelize";
config();

const FILE_NAME = 'me.js';

export async function me(body) {
    const userId = body.userId;
    delete body.userId;

    const requestId = body.requestId;
    delete body.requestId;

    try {

        const userDataFromDB = await getUser(
            {
                id: userId,
                deleted_at: null
            },
            [
                {
                    model: UserInformation,
                    attributes: {
                        exclude: ['updated_at', 'created_at', 'id'],
                    },
                    as: 'user_information',
                },
                {
                    model: Idea,
                    as: 'ideas',
                    attributes: ['id', 'name'],
                    where: {
                        idea_capture: {
                            [Op.ne]: null,

                        },

                    },
                    required: false,
                }
            ],
            ['id', 'email', 'persona_type', 'consented_at'],
            requestId
        );

        if (userDataFromDB.error) {
            return userDataFromDB.errorData
        }

        const userData = userDataFromDB.data.user;

        return {
            statusCode: 200,
            body: {
                user_id: userData.id,
                persona_type: userData.persona_type,
                email: userData.email,
                user_information: userData.user_information,
                ideas: userData.ideas.length,
                consented_at: userData?.consented_at,
            }
        };
    } catch (error) {
        logger.error(FILE_NAME, 'me', requestId, {
            error,
            errorMessage: error.message,
            errorStack: error.stack
        });
        return {
            statusCode: 500,
            body: {
                message: 'Internal Server Error! Failed to get the user information.',
            }
        };
    }
}
