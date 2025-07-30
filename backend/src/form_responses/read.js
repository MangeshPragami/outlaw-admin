import { getFormResponses } from './crud.js';
import { logger } from "../logger/logger.js";
import { readDataFromS3 } from '../helper/AWS/s3.js';
import { parseStringifiedBody } from '../helper/helper.js';
import { getFormResponsesValidation, getFormValidation } from "../joi/validation.js";
import { getForm } from '../forms/crud.js';

const FILE_NAME = 'form_responses/read.js';

// API checks if user accessing resource is either the owner of the form or owner of the form response. It returns the form response only if checks pass.
export async function getFormResponseAPI(body) {
    
    const userId = body.userId;
    delete body.userId;

    const requestId = body.requestId;
    delete body.requestId; 
    
    try {
        const { headerError, bodyError } = getFormResponsesValidation(body);
        if (headerError || bodyError) {
            return {
                statusCode: 400,
                body: {
                    message: 'Oops! Something went wrong.',
                    error: 'Invalid payload ' + (headerError || bodyError.details.map(d => d.message).join('; '))
                }
            }
        }

        const formDataFromDB = await getForm(
            { creator_id: userId, id: body.formId },
            null,
            null,
            requestId
        )

        if (formDataFromDB.error) {
            if (formDataFromDB.errorData.statusCode !== 404) {
                return formDataFromDB.errorData;
            }
        }

        const formData = formDataFromDB?.data?.form;

        const getFormResponsePayload = {
            responder_id: userId,
            id: body.formResponseId
        }

        if (Object.keys(formData || {}).length) {
            delete getFormResponsePayload.responder_id;
        }

        const formResponseDataFromDB = await getFormResponses(
            getFormResponsePayload,
            null,
            ['form_response_url'],
            requestId
        );

        if (formResponseDataFromDB.error) {
            return formResponseDataFromDB.errorData;
        }

        const formResponseData = formResponseDataFromDB.data.formResponses[0];

        const formDataFromS3 = await readDataFromS3(formResponseData.form_response_url, requestId);

        if (formDataFromS3.error) {
            return formDataFromS3.errorData;
        }

        const parsedData = parseStringifiedBody(formDataFromS3.data.stringifiedResponse);

        return {
            statusCode: 201,
            body: {
                message: 'Form response fetched successfully.',
                formResponse: parsedData
            }
        };

    } catch (error) {
        logger.error(FILE_NAME, 'getFormResponseAPI', requestId, {
            error,
            errorMessage: error.message,
            errorStack: error.stack
        });
        return {
            statusCode: 500,
            body: {
                message: 'Could not fetch form response'
            }
        }
    }
}

// API fetches all the responses of a form
export async function getFormResponsesAPI(body) {
    
    const userId = body.userId;
    delete body.userId;

    const requestId = body.requestId;
    delete body.requestId; 
    
    try {
        const { headerError, bodyError } = getFormValidation(body);
        if (headerError || bodyError) {
            return {
                statusCode: 400,
                body: {
                    message: 'Oops! Something went wrong.',
                    error: 'Invalid payload ' + (headerError || bodyError.details.map(d => d.message).join('; '))
                }
            }
        }

        const formResponseDataFromDB = await getFormResponses(
            {
                creator_id: userId,
                id: body.formResponseId
            },
            null,
            ['id'],
            requestId
        );

        if (formResponseDataFromDB.error) {
            return formResponseDataFromDB.errorData;
        }

        const formResponseData = formResponseDataFromDB.data.formResponses;

        return {
            statusCode: 201,
            body: {
                message: 'Form response fetched successfully.',
                formResponseIds: formResponseData
            }
        };

    } catch (error) {
        logger.error(FILE_NAME, 'getFormResponseAPI', requestId, {
            error,
            errorMessage: error.message,
            errorStack: error.stack
        });
        return {
            statusCode: 500,
            body: {
                message: 'Could not fetch form response'
            }
        }
    }
}