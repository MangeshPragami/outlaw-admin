import { FormResponses } from '../db/pool.js';
import { logger } from '../logger/logger.js';

const FILE_NAME = 'form_responses/crud.js';

export async function getFormResponses(where, include, attributes, requestId) {
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

        const formResponses = await FormResponses.findAll(queryObj)

        if (!formResponses || !formResponses.length) {
            return {
                error: true,
                errorData: {
                    statusCode: 404,
                    body: {
                        message: 'form responses not found.'
                    }
                }
            }
        }

        return {
            error: false,
            data: {
                formResponses
            }
        }
    } catch (error) {
        logger.error(FILE_NAME, 'getFormResponses', requestId, {
            error,
            errorMessage: error.message,
            errorStack: error.stack
        });
        return {
            error: true,
            errorData: {
                statusCode: 500,
                body: {
                    message: 'Could not fetch form responses'
                }
            }
        }
    }
}

export async function createFormResponses(data, requestId) {
    try {

        const createFormResponses = await FormResponses.create(data)
        const plainData = formCreateResponse.get({ plain: true });

        if (!plainData || !plainData.id) {
            return {
                error: true,
                errorData: {
                    statusCode: 404,
                    body: {
                        message: 'Form response could not be created.'
                    }
                }
            }
        }

        return {
            error: false,
            data: {
                formResponses: plainData
            }
        }
    } catch (error) {
        logger.error(FILE_NAME, 'createFormResponses', requestId, {
            error,
            errorMessage: error.message,
            errorStack: error.stack
        });
        return {
            error: true,
            errorData: {
                statusCode: 500,
                body: {
                    message: 'Could not create form responses'
                }
            }
        }
    }
}

export async function updateFormResponses(where, data, requestId) {
    try {

        if (!where) {
            throw DB_ERRORS.DB_01;
        }

        if (!data.updated_at) {
            data.updated_at = new Date().toISOString();
        }

        const [affectedCount, affectedRows] = await FormResponses.update(
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
                        message: 'Form response could not be updated.'
                    }
                }
            }
        }

        return {
            error: false,
            data: {
                formResponses: affectedRows[0]
            }
        }
    } catch (error) {
        logger.error(FILE_NAME, 'updateFormResponses', requestId, {
            error,
            errorMessage: error.message,
            errorStack: error.stack
        });
        return {
            error: true,
            errorData: {
                statusCode: 500,
                body: {
                    message: 'Could not update form responses'
                }
            }
        }
    }
}