import { config } from 'dotenv';
import { logger } from '../logger/logger.js';
import { getIdea, updateIdea } from './crud.js';
import { uploadDataToS3 } from '../helper/AWS/s3.js';
import { storeIdeaValidation } from "../joi/validation.js";
import { createIdeaAxiosInstance } from "../helper/axiosInstance.js";
config();

const FILE_NAME = 'storeIdea.js';

export async function storeIdea(body) {
    const userId = body.userId;
    delete body.userId;

    const requestId = body.requestId;
    delete body.requestId;

    try {
        const { headerError, bodyError } = storeIdeaValidation(body);

        if (headerError || bodyError) {
            return {
                statusCode: 400,
                body: {
                    message: 'Oops! Something went wrong.',
                    error: 'Invalid payload ' + (headerError || bodyError.details.map(d => d.message).join('; '))
                }
            };
        }

        const aiRequestId = body.request_id

        const key = `users/${userId}/idea-capture/${aiRequestId}.json`;
        
        const finaliseData = (await createIdeaAxiosInstance.post('/finalize', body))?.data;
        const jsonBody = JSON.stringify(finaliseData, null, 2);

        const uploadResponse = await uploadDataToS3(key, jsonBody, requestId);

        if (uploadResponse.error) {
            return uploadResponse.errorData;
        }

        const ideaFromDB = await getIdea(
            { ai_request_id: aiRequestId },
            null,
            null,
            null,
            requestId
        );

        if (ideaFromDB.error) {
            return ideaFromDB.errorData;
        }

        const updateIdeaResponse = await updateIdea(
            { ai_request_id: aiRequestId },
            { idea_capture: uploadResponse.data.location },
            requestId
        );

        if (updateIdeaResponse.error) {
            return updateIdeaResponse.errorData;
        }

        return {
            statusCode: 201,
            body: {
                message: 'Idea capture stored successfully.',
            }
        };

    } catch (error) {
        logger.error(FILE_NAME, 'storeIdea', requestId, {
            error,
            errorMessage: error.message,
            errorStack: error.stack
        });
        return {
            statusCode: 500,
            body: {
                message: 'Internal Server Error! Failed to create the idea.',
            }
        };
    }
}
