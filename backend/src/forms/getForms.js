import { getForm } from './crud.js';
import { logger } from "../logger/logger.js";
import { readDataFromS3 } from '../helper/AWS/s3.js';
import { getFormValidation } from "../joi/validation.js";
import { parseStringifiedBody } from '../helper/helper.js';
import {Form, FormResponses} from "../db/pool.js";
import { Sequelize } from 'sequelize';

const FILE_NAME = 'form/getForms.js';

export async function getForms (body) {

    const requestId = body.requestId;
    delete body.requestId;
    const userId = body.userId;
    delete body.userId;

    // Pagination defaults
    const page = body.page ? parseInt(body.page, 10) : 1;
    const pageSize = body.pageSize ? parseInt(body.pageSize, 10) : 50;
    const offset = (page - 1) * pageSize;

    try {
        const { count, rows: forms } = await Form.findAndCountAll({
            offset,
            limit: pageSize,
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
            ],
            order: [['id', 'DESC']],
            attributes: {
                include: [
                    [
                        Sequelize.literal(`EXISTS (
                            SELECT 1 FROM "form_responses"
                            WHERE "form_responses"."form_id" = "Form"."id"
                            AND "form_responses"."responder_id" = ${userId}
                        )`),
                        'hasResponded'
                    ]
                ]
            }
        });

        // No need to map forms, hasResponded is already included
        return {
            statusCode: 200,
            body: {
                message: 'Form fetched successfully.',
                data: forms,
                pagination: {
                    total: count,
                    page,
                    pageSize,
                    totalPages: Math.ceil(count / pageSize)
                }
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
