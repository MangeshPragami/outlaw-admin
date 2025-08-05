import axios from 'axios';
import { Op } from 'sequelize';
import { config } from 'dotenv';
import { logger } from '../logger/logger.js';
import { getIdeas } from './crud.js';
config();

const FILE_NAME = 'getIdeas.js';

export async function getIdeasAPI(body) {
    const userId = body.userId;
    delete body.userId;

    const requestId = body.requestId;
    delete body.requestId;

    try {
        const getIdeasFromDB = await getIdeas(
            {
                user_id: userId,
                idea_capture: {
                    [Op.not]: null
                }
            },
            null,
            null,
            [['created_at', 'DESC']],
            requestId
        );

        if (getIdeasFromDB.error) {
            return getIdeasFromDB.errorData;
        }

        const ideas = getIdeasFromDB.data.ideas;

        const promiseArr = [];

        for (const idea of ideas) {
            promiseArr.push(axios.get(idea.idea_capture));
        }

        const promiseResults = await Promise.allSettled(promiseArr);

        const enrichedIdeas = [];

        for (const index in promiseResults) {
            
            const promiseResult = promiseResults[index];
            
            if (promiseResult.status === 'rejected') {
                
                logger.error(FILE_NAME, 'getIdeasAPI', requestId, {
                    errorMessage: `Failed to fetch idea_capture for idea ID ${ideas[index].id}`,
                });
                
                enrichedIdeas.push({
                    ...ideas[index].toJSON(),
                    idea_capture_data: null
                });
            }

            enrichedIdeas.push({ ideaCaptureData: promiseResult.value.data, id: ideas[index].id })
        }

        return {
            statusCode: 200,
            body: {
                ideas: enrichedIdeas,
                count: ideas.length,
                message: 'Ideas fetched successfully'
            }
        };
    } catch (error) {
        logger.error(FILE_NAME, 'getIdeas', requestId, {
            error,
            errorMessage: error.message,
            errorStack: error.stack
        });
        return {
            statusCode: 500,
            body: {
                message: 'Internal Server Error',
                error: 'Failed to fetch ideas.'
            }
        };
    }
}
