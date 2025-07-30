import { getForm } from './crud.js';
import { logger } from "../logger/logger.js";
import { readDataFromS3 } from '../helper/AWS/s3.js';
import { getFormValidation } from "../joi/validation.js";
import { parseStringifiedBody } from '../helper/helper.js';

const FILE_NAME = 'form/read.js';

export async function getFormAPI (body) {
    
    const userId = body.userId;
    delete body.userId;

    const requestId = body.requestId;
    delete body.requestId;

    console.log('body', body)
    
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

        const formDataFromDB = await getForm(
            {
                creator_id: userId,
                idea_id: body.ideaId
            },
            null,
            ['form_url'],
            requestId
        );

        if (formDataFromDB.error) {
            return formDataFromDB.errorData;
        }

        const formData = formDataFromDB.data.form;

        const formDataFromS3 = await readDataFromS3(formData.form_url.split('/').slice(3).join('/'), requestId);

        if (formDataFromS3.error) {
            return formDataFromS3.errorData;
        }

        const parsedData = parseStringifiedBody(formDataFromS3.data.stringifiedResponse);

        return {
            statusCode: 201,
            body: {
                message: 'Form fetched successfully.',
                form: parsedData
            }
        };

    } catch (error) {
        logger.error(FILE_NAME, 'getFormAPI', requestId, {
            error,
            errorMessage: error.message,
            errorStack: error.stack
        });
        return {
            statusCode: 500,
            body: {
                message: 'Could not fetch form'
            }
        }
    }
}
