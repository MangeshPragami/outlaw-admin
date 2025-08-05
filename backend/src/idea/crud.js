import { Idea } from '../db/pool.js';
import { logger } from '../logger/logger.js';

const FILE_NAME = 'idea/crud.js';

export async function getIdea(where, include, attributes, orderBy, requestId) {
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

        if (orderBy && orderBy.length) {
            queryObj.order = orderBy;
        }

        const idea = await Idea.findOne(queryObj)

        if (!idea) {
            return {
                error: true,
                errorData: {
                    statusCode: 404,
                    body: {
                        message: 'Idea not found.'
                    }
                }
            }
        }

        return {
            error: false,
            data: {
                idea
            }
        }
    } catch (error) {
        logger.error(FILE_NAME, 'getIdea', requestId, {
            error,
            errorMessage: error.message,
            errorStack: error.stack
        });
        return {
            error: true,
            errorData: {
                statusCode: 500,
                body: {
                    message: 'Could not fetch idea'
                }
            }
        }
    }
}

export async function getIdeas(where, include, attributes, orderBy, requestId) {
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

        if (orderBy.length) {
            queryObj.order = orderBy;
        }

        const ideas = await Idea.findAll(queryObj)

        if (!ideas || !ideas.length) {
            return {
                error: true,
                errorData: {
                    statusCode: 404,
                    body: {
                        message: 'Ideas not found.'
                    }
                }
            }
        }

        return {
            error: false,
            data: {
                ideas
            }
        }
    } catch (error) {
        logger.error(FILE_NAME, 'getIdea', requestId, {
            error,
            errorMessage: error.message,
            errorStack: error.stack
        });
        return {
            error: true,
            errorData: {
                statusCode: 500,
                body: {
                    message: 'Could not fetch idea'
                }
            }
        }
    }
}

export async function createIdea(data, requestId) {
    try {

        const ideaCreateResponse = await Idea.create(data)
        const plainData = ideaCreateResponse.get({ plain: true });

        if (!plainData || !plainData.id) {
            return {
                error: true,
                errorData: {
                    statusCode: 404,
                    body: {
                        message: 'Idea could not be created.'
                    }
                }
            }
        }

        return {
            error: false,
            data: {
                idea: plainData
            }
        }
    } catch (error) {
        logger.error(FILE_NAME, 'createIdea', requestId, {
            error,
            errorMessage: error.message,
            errorStack: error.stack
        });
        return {
            error: true,
            errorData: {
                statusCode: 500,
                body: {
                    message: 'Could not create idea'
                }
            }
        }
    }
}

export async function updateIdea(where, data, requestId) {
    try {

        if (!where) {
            throw DB_ERRORS.DB_01;
        }

        if (!data.updated_at) {
            data.updated_at = new Date().toISOString();
        }

        const [affectedCount, affectedRows] = await Idea.update(
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
                        message: 'Idea could not be updated.'
                    }
                }
            }
        }

        return {
            error: false,
            data: {
                idea: affectedRows[0]
            }
        }
    } catch (error) {
        logger.error(FILE_NAME, 'updateIdea', requestId, {
            error,
            errorMessage: error.message,
            errorStack: error.stack
        });
        return {
            error: true,
            errorData: {
                statusCode: 500,
                body: {
                    message: 'Could not update idea'
                }
            }
        }
    }
}
