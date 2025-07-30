import { config } from 'dotenv';
import { Idea } from '../db/pool.js';
import { logger } from '../logger/logger.js';
import axios from 'axios';
import {lensSelectorAxiosInstance} from "../helper/axiosInstance.js";
import {uploadDataToS3} from "../helper/AWS/s3.js";

config();

const FILE_NAME = 'getLatestIdea.js';

export async function ideaLensSelector(event) {
    const { userId, requestId, ideaId } = event;

    if (!userId) {
        return {
            statusCode: 400,
            body: {
                message: 'User ID is required.'
            }
        };
    }

    try {
        let idea;

        if (ideaId) {
            idea = await Idea.findOne({
                where: {
                    id: ideaId,
                    user_id: userId
                }
            });
        } else {
            idea = await Idea.findOne({
                where: { user_id: userId },
                order: [['created_at', 'DESC']]
            });
        }

        if (!idea) {
            return {
                statusCode: 404,
                body: {
                    message: 'No idea found.'
                }
            };
        }

        let aiPayload = {};
        let lensSelector = null;

        if (idea.idea_capture) {
            try {
                const { data: ideaCaptureData } = await axios.get(idea.idea_capture);

                aiPayload = {
                    title: ideaCaptureData?.input_metadata?.title,
                    description: ideaCaptureData?.input_metadata?.description,
                    tags: ideaCaptureData?.input_metadata?.tags,
                    stage: idea.stage
                };

                try {
                    const lensSelectorResponse = await lensSelectorAxiosInstance.post('/lens-selector', aiPayload);
                    lensSelector = lensSelectorResponse?.data;
                } catch (e) {
                    console.log('lens selector error', e);
                    return {
                        statusCode: 500,
                        body: { message: 'Lens selector API error.' }
                    };
                }

            } catch (err) {
                logger.warn(FILE_NAME, 'getIdeaCaptureData', requestId, {
                    warning: 'Failed to fetch idea_capture JSON',
                    url: idea.idea_capture,
                    errorMessage: err.message
                });
            }
        }

        try {
            const key = `users/${userId}/lens-selector/${lensSelector?.request_id}.json`;
            const jsonBody = JSON.stringify(lensSelector, null, 2);
            const uploadResponse = await uploadDataToS3(key, jsonBody, requestId);

            if(uploadResponse.error) {
                return uploadResponse.errorData;
            }

            idea.lens_selector = uploadResponse?.data?.location;
            await idea.save();
        } catch (e) {
            console.log('S3 Upload Error', e);
            return {
                statusCode: 500,
                body: { message: 'Failed to save lens selector to S3.' }
            };
        }

        return {
            statusCode: 200,
            body: {
                message: 'Idea processed successfully.',
                data: lensSelector,
            }
        };

    } catch (error) {
        logger.error(FILE_NAME, 'ideaLensSelector', requestId, {
            error,
            errorMessage: error.message,
            errorStack: error.stack
        });

        return {
            statusCode: 500,
            body: {
                message: 'Internal Server Error.'
            }
        };
    }
}
