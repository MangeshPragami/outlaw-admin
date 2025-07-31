import { updateForm } from './crud.js';
import { logger } from "../logger/logger.js";
import { uploadDataToS3 } from "../helper/AWS/s3.js";
import { retryFormUploadValidation } from "../joi/validation.js";

const FILE_NAME = '/forms/retry.js';

export async function createFormS3LinkAPI(body) {
    
    const userId = body.userId;
    delete body.userId;

    const requestId = body.requestId;
    delete body.requestId; 
    
    try {

        const { headerError, bodyError } = retryFormUploadValidation(body);
        if (headerError || bodyError) {
            return {
                statusCode: 400,
                body: {
                    message: 'Oops! Something went wrong.',
                    error: 'Invalid payload ' + (headerError || bodyError.details.map(d => d.message).join('; '))
                }
            }
        }
        
        const key = `users/${userId}/idea-capture/${body.ideaId}/survey/${body.formId}.json`;
        const jsonBody = JSON.stringify(body, null, 2);

        const uploadResponse = await uploadDataToS3(key, jsonBody, requestId);

        if (uploadResponse.error) {
            return uploadResponse.errorData;
        }

        const updateResponse = await updateForm(
            {
                id: formResponseId
            }, 
            {
                form_url: uploadResponse.data.location
            },
            requestId
        );

        if (updateResponse.error) {
            return updateResponse.errorData;
        }

        return {
            statusCode: 201,
            body: {
                message: 'Form updated successfully.',
            }
        };

    } catch (error) {
        logger.error(FILE_NAME, 'createFormS3LinkAPI', requestId, {
            error,
            errorMessage: error.message,
            errorStack: error.stack
        });
        return {
            statusCode: 500,
            body: {
                message: 'Could not create form response s3 link'
            }
        }
    }
}