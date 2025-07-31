import axios from 'axios';
import { config } from 'dotenv';
import { getIdea } from './crud.js';
import { logger } from '../logger/logger.js';

config();

const FILE_NAME = 'getStoreIdea.js';

export async function getStoreIdea(body) {
    const { userId, requestId, ideaId } = body;

    try {
        const ideaFromDB = await getIdea(
            { user_id: userId, id: ideaId },
            null,
            null,
            [['created_at', 'DESC']],
            requestId
        )

        if (ideaFromDB.error) {
            return ideaFromDB.errorData;
        }

        const latestIdea = ideaFromDB.data.idea;

        if (!latestIdea.idea_capture) {
            return {
                statusCode: 200,
                body: {
                    message: 'Latest idea fetched successfully.',
                    data: {},
                }
            };
        }
        
        let aiResponse = {};

        const url = latestIdea.idea_capture;

        await axios.get(url)
            .then(response => {
                aiResponse = {
                    ...response.data,
                    message: 'SUCCESS',
                    stage: latestIdea.stage
                };
            })
            .catch(() => {
                aiResponse = {
                    message: 'ERROR'
                };
            });

        return {
            statusCode: 200,
            body: {
                message: 'Latest idea fetched successfully.',
                data: aiResponse,
                ideaId: latestIdea.id
            }
        };

    } catch (error) {
        logger.error(FILE_NAME, 'getStoreIdea', requestId, {
            error,
            errorMessage: error.message,
            errorStack: error.stack
        });

        return {
            statusCode: 500,
            body: {
                message: 'Internal Server Error while fetching latest idea.'
            }
        };
    }
}
