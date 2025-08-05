import { getForm } from "../forms/crud.js";
import { logger } from "../logger/logger.js";
import { updateFormResponses } from './crud.js';
import { uploadDataToS3 } from "../helper/AWS/s3.js";
import { retryFormResponsesUploadValidation } from "../joi/validation.js";

const FILE_NAME = '/forms_responses/retry.js';

export async function createFormResponseS3LinkAPI(body) {
    
    const userId = body.userId;
    delete body.userId;

    const requestId = body.requestId;
    delete body.requestId; 
    
    try {
        
        const now = new Date().getTime();

        const { headerError, bodyError } = retryFormResponsesUploadValidation(body);
        if (headerError || bodyError) {
            return {
                statusCode: 400,
                body: {
                    message: 'Oops! Something went wrong.',
                    error: 'Invalid payload ' + (headerError || bodyError.details.map(d => d.message).join('; '))
                }
            }
        }

        const formDataFromDB = await getForm({ id: body.formId }, null, null, requestId);
        
        if (formDataFromDB.error) {
            return formDataFromDB.errorData;
        }

        const formData = formDataFromDB.data.form;

        const formEndsAt = new Date(formData.ends_at).getTime();
        const formStartsAt = new Date(formData.starts_at).getTime();

        if (formStartsAt > now || formEndsAt < now) {
            return {
                statusCode: 409,
                body: {
                    message: 'Form is no longer accepting responses!'
                }
            }
        }
        
        const key = `users/${userId}/idea-capture/${body.ideaId}/survey/${body.formId}/${body.formResponseId}.json`;
        const jsonBody = JSON.stringify({ questions: body.questions }, null, 2);

        const uploadResponse = await uploadDataToS3(key, jsonBody, requestId);

        if (uploadResponse.error) {
            return uploadResponse.errorData;
        }

        const updateResponse = await updateFormResponses(
            {
                id: formResponseId
            }, 
            {
                form_response_url: uploadResponse.data.location
            },
            requestId
        );

        if (updateResponse.error) {
            return updateResponse.errorData;
        }

        return {
            statusCode: 201,
            body: {
                message: 'Form Response updated successfully.',
            }
        };

    } catch (error) {
        logger.error(FILE_NAME, 'createFormResponseS3LinkAPI', requestId, {
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