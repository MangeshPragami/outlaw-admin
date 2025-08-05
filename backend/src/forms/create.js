import { logger } from "../logger/logger.js";
import { createForm, updateForm } from './crud.js';
import { uploadDataToS3 } from '../helper/AWS/s3.js';
import { createFormValidation } from "../joi/validation.js";
import { getTimeStampForDataBase } from "../helper/helper.js";

const FILE_NAME = '/forms/create.js';

export async function createFormAPI(body) {
    
    const userId = body.userId;
    delete body.userId;

    const requestId = body.requestId;
    delete body.requestId; 
    
    try {

        const { headerError, bodyError } = createFormValidation(body);
        if (headerError || bodyError) {
            return {
                statusCode: 400,
                body: {
                    message: 'Oops! Something went wrong.',
                    error: 'Invalid payload ' + (headerError || bodyError.details.map(d => d.message).join('; '))
                }
            }
        }

        const start = new Date(body.startTime);
        const end = new Date(body.endTime);

        if(start >= end) {
             return {
                 error: true,
                 errorData: {
                     statusCode: 400,
                     body: {
                         message: 'Start Time must be before End Time!',
                     }
                 }
             }
        }

        // ID based keys are validated at DB level, via Foreign Key constraints.
        const createFormResponse = await createForm({
            creator_id: userId,
            idea_id: body.ideaId,
            end_time: getTimeStampForDataBase(body.endTime),
            start_time: getTimeStampForDataBase(body.startTime)
        }, requestId);

        if (createFormResponse.error) {
            return createFormResponse.errorData;
        }

        const formId = createFormResponse.data.form.id;

        const key = `users/${userId}/idea-capture/${body.ideaId}/survey/${formId}/form_data.json`;
        const jsonBody = JSON.stringify({ questions: body.questions, demographic: body.demographic }, null, 2);

        const uploadResponse = await uploadDataToS3(key, jsonBody, requestId);

        if (uploadResponse.error) {
            uploadResponse.errorData.body.formId = formId;
            return uploadResponse.errorData;
        }

        const updateFormResponse = await updateForm(
            { id: formId },
            { form_url: uploadResponse.data.location },
            requestId
        );

        if (updateFormResponse.error) {
            return updateFormResponse.errorData;
        }

        return {
            statusCode: 201,
            body: {
                message: 'Form created successfully.',
                formId
            }
        };

    } catch (error) {
        logger.error(FILE_NAME, 'createFormAPI', requestId, {
            error,
            errorMessage: error.message,
            errorStack: error.stack
        });
        return {
            statusCode: 500,
            body: {
                message: 'Could not create form'
            }
        }
    }
}
