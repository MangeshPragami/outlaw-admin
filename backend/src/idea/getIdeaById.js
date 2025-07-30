import { config } from 'dotenv';
import { Idea } from '../db/pool.js';
import { logger } from '../logger/logger.js';
import axios from 'axios';

config();

const FILE_NAME = 'getIdeaById.js';

export async function getIdeaById(body) {
    const { ideaId, userId, requestId } = body;

    if (!ideaId || !userId) {
        return {
            statusCode: 400,
            body: {
                message: 'Missing ideaId or userId in request.'
            }
        };
    }

    try {
        const idea = await Idea.findOne({ where: { id: ideaId, user_id: userId } });

        if (!idea) {
            return {
                statusCode: 404,
                body: {
                    message: 'Idea not found or does not belong to the user.'
                }
            };
        }

        let ideaCaptureData = null;

        if (idea.idea_capture) {
            try {
                const { data } = await axios.get(idea.idea_capture);
                ideaCaptureData = data;
            } catch (err) {
                logger.warn(FILE_NAME, 'getIdeaById', requestId, {
                    message: `Failed to fetch idea_capture from ${idea.idea_capture}`,
                    error: err.message
                });
            }
        }

        return {
            statusCode: 200,
            body: {
                message: 'Idea fetched successfully',
                idea: {
                    ...idea.toJSON(),
                    idea_capture_data: ideaCaptureData
                }
            }
        };
    } catch (error) {
        logger.error(FILE_NAME, 'getIdeaById', requestId, {
            error,
            errorMessage: error.message,
            errorStack: error.stack
        });

        return {
            statusCode: 500,
            body: {
                message: 'Internal Server Error',
                error: 'Failed to fetch idea.'
            }
        };
    }
}
