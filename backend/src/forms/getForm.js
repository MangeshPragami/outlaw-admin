import { logger } from "../logger/logger.js";
import { createForm, updateForm } from './crud.js';
import { uploadDataToS3 } from '../helper/AWS/s3.js';
import { createFormValidation } from "../joi/validation.js";
import { getTimeStampForDataBase } from "../helper/helper.js";
import {Form, FormResponses, Idea} from "../db/pool.js";
import axios from "axios";

const FILE_NAME = '/forms/getForm.js';

export async function getForm(body) {

    const formId = body.formId;
    const userId = body.userId;

    console.log({
        formId
    })

    const requestId = body.requestId;
    delete body.requestId;

    try {

        const form = await Form.findByPk(formId, {
            include: [
                {
                    association: 'idea',
                    attributes: ['id', 'name', 'description']
                },
                {
                    association: 'user',
                    attributes: ['id', 'email'],
                    include: [
                        {
                            association: 'user_information',
                            attributes: ['name', 'avatar']
                        }
                    ]
                }
            ]
        });

        if(!form) {
            return {
                statusCode: 404,
                body: {
                    message: 'Form not found',
                }
            }
        }



        const formResponse = await FormResponses.findOne({
            where: {
                responder_id: userId,
                form_id: formId
            }
        })

        let question = null
        let hasResponded = false;

        if(formResponse) {
            const { data } = await axios.get(formResponse.form_response_url);
            question = data?.responses;
            hasResponded = true
        } else {
            const { data } = await axios.get(form.form_url);
            question = data.questions;
        }


        return {
            statusCode: 201,
            body: {
                message: 'Form fetched.',
                data: {
                    questions: question,
                    idea: form.idea,
                    user: form.user,
                    hasResponded
                }
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
