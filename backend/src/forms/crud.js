import { Form } from '../db/pool.js';
import { logger } from '../logger/logger.js';

const FILE_NAME = 'forms/crud.js';

export async function getForm(where, include, attributes, requestId) {
    try {
        if (!where) {
            throw DB_ERRORS.DB_01;
        }

        const queryObj = {
            where,
            raw: true
        }

        if (include) {
            queryObj.include = include;
        }

        if (attributes && attributes.length) {
            queryObj.attributes = attributes;
        }

        const form = await Form.findOne(queryObj)

        if (!form) {
            return {
                error: true,
                errorData: {
                    statusCode: 404,
                    body: {
                        message: 'Form not found.'
                    }
                }
            }
        }

        return {
            error: false,
            data: {
                form
            }
        }
    } catch (error) {
        logger.error(FILE_NAME, 'getForm', requestId, {
            error,
            errorMessage: error.message,
            errorStack: error.stack
        });
        return {
            error: true,
            errorData: {
                statusCode: 500,
                body: {
                    message: 'Could not fetch form'
                }
            }
        }
    }
}

export async function createForm(data, requestId) {
    try {

        const formCreateResponse = await Form.create(data)
        const plainData = formCreateResponse.get({ plain: true });

        if (!plainData || !plainData.id) {
            return {
                error: true,
                errorData: {
                    statusCode: 404,
                    body: {
                        message: 'Form could not be created.'
                    }
                }
            }
        }

        return {
            error: false,
            data: {
                form: plainData
            }
        }
    } catch (error) {
        logger.error(FILE_NAME, 'createForm', requestId, {
            error,
            errorMessage: error.message,
            errorStack: error.stack
        });
        return {
            error: true,
            errorData: {
                statusCode: 500,
                body: {
                    message: 'Could not create form'
                }
            }
        }
    }
}

export async function updateForm(where, data, requestId) {
    try {

        if (!where) {
            throw DB_ERRORS.DB_01;
        }

        if (!data.updated_at) {
            data.updated_at = new Date().toISOString();
        }

        const [affectedCount, affectedRows] = await Form.update(
            data,
            {
                where,
                returning: true,
                raw: true
            }
        )

        if (affectedCount === 0 || !Object.keys(affectedRows[0] || {}).length) {
            return {
                error: true,
                errorData: {
                    statusCode: 404,
                    body: {
                        message: 'Form could not be updated.'
                    }
                }
            }
        }

        return {
            error: false,
            data: {
                form: affectedRows[0]
            }
        }
    } catch (error) {
        logger.error(FILE_NAME, 'updateForm', requestId, {
            error,
            errorMessage: error.message,
            errorStack: error.stack
        });
        return {
            error: true,
            errorData: {
                statusCode: 500,
                body: {
                    message: 'Could not update form'
                }
            }
        }
    }
}
