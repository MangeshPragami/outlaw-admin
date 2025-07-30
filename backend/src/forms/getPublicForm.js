import { logger } from "../logger/logger.js";
import { createForm, updateForm } from './crud.js';
import { uploadDataToS3 } from '../helper/AWS/s3.js';
import { createFormValidation } from "../joi/validation.js";
import { getTimeStampForDataBase } from "../helper/helper.js";
import {Form, Idea} from "../db/pool.js";
import axios from "axios";

const FILE_NAME = '/forms/getPublicForm.js';

export async function getPublicForm(body) {

    const formId = body.formId;

    const requestId = body.requestId;
    delete body.requestId;

    try {

        const form = await Form.findByPk(formId);

        if(!form) {
            return {
                statusCode: 404,
                body: {
                    message: 'Form not found',
                }
            }
        }

        const { data } = await axios.get(form.form_url);

        return {
            statusCode: 201,
            body: {
                message: 'Form fetched.',
                data: data?.questions
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
