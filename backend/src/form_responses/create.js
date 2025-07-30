import { getUser } from "../user/crud.js";
import { getForm } from "../forms/crud.js";
import { logger } from "../logger/logger.js";
import { uploadDataToS3 } from "../helper/AWS/s3.js";
import { createFormResponses, updateFormResponses } from './crud.js';
import { createFormResponsesValidation } from "../joi/validation.js";

const FILE_NAME = 'form_responses/create.js';

export async function createFormResponseAPI(body) {
    
    const userId = body.userId;
    delete body.userId;

    const requestId = body.requestId;
    delete body.requestId; 
    
    try {

        const now = new Date().getTime();

        const { headerError, bodyError } = createFormResponsesValidation(body);
        if (headerError || bodyError) {
            return {
                statusCode: 400,
                body: {
                    message: 'Oops! Something went wrong.',
                    error: 'Invalid payload ' + (headerError || bodyError.details.map(d => d.message).join('; '))
                }
            }
        }

        const [userDataFromDB, formDataFromDB] = await Promise.allSettled([
            getUser(
                { 
                    id: userId,
                    deleted_at: null
                }, 
                null,
                ['id', 'persona_type'],
                requestId
            ),
            getForm(
                {
                    id: body.formId
                },
                null,
                ['id', 'starts_at', 'ends_at'],
                requestId
            )
        ]);

        if (userDataFromDB.status === 'rejected') {
            return {
                statusCode: 400,
                body: {
                    message: 'Failed to fetch user details!'
                }
            }
        }
        
        if (formDataFromDB.status === 'rejected') {
            return {
                statusCode: 400,
                body: {
                    message: 'Failed to fetch form details!'
                }
            }
        }
        
        if (userDataFromDB.value.error) {
            return userDataFromDB.value.errorData;
        }

        if (formDataFromDB.value.error) {
            return formDataFromDB.value.errorData;
        }
        
        const userData = userDataFromDB.value.data.user;
        const formData = formDataFromDB.value.data.form;

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

        // ID based keys are validated at DB level, via Foreign Key constraints.
        const createFormResponseData = await createFormResponses({
            responder_id: userData.id,
            responsder_type: userData.persona_type,
            form_id: body.formId
        }, requestId);

        if (createFormResponseData.error) {
            return createFormResponseData.errorData;
        }

        const formResponseId = createFormResponseData.data.formResponses.id;

        const key = `users/${userId}/idea-capture/${body.ideaId}/survey/${body.formId}/${formResponseId}.json`;
        const jsonBody = JSON.stringify({ questions: body.questions }, null, 2);

        const uploadResponse = await uploadDataToS3(key, jsonBody, requestId);

        if (uploadResponse.error) {
            uploadResponse.errorData.body.formResponseId = formResponseId;
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
                message: 'Form response created successfully.',
                formId
            }
        };

    } catch (error) {
        logger.error(FILE_NAME, 'createFormResponseAPI', requestId, {
            error,
            errorMessage: error.message,
            errorStack: error.stack
        });
        return {
            statusCode: 500,
            body: {
                message: 'Could not create form response'
            }
        }
    }
}