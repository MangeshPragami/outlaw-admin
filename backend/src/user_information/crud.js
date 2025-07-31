import { logger } from "../logger/logger.js";
import { UserInformation } from "../db/pool.js";
import { DB_ERRORS } from "../helper/constants.js";

const FILE_NAME = 'user_information/crud.js';

export async function getUserInformation(where, include, attributes, requestId) {
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

        const userData = await UserInformation.findOne(queryObj);

        if (!userData) {
            return {
                error: true,
                errorData: {
                    statusCode: 404,
                    body: {
                        message: 'User Information not found.'
                    }
                }
            }
        }

        return {
            error: false,
            data: {
                user: userData
            }
        }
    } catch (error) {
        logger.error(FILE_NAME, 'getUserInformation', requestId, {
            error,
            errorMessage: error.message,
            errorStack: error.stack
        });
        return {
            error: true,
            errorData: {
                statusCode: 404,
                body: {
                    message: 'Oops something went wrong! Could not retrieve user information.'
                }
            }
        }
    }
}

export async function getUsersInformation(where, include, attributes, requestId) {
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

        const usersData = await UserInformation.findAll(queryObj);

        if (!usersData || !usersData.length) {
            return {
                error: true,
                errorData: {
                    statusCode: 404,
                    body: {
                        message: 'Users Information not found.'
                    }
                }
            }
        }

        return {
            error: false,
            data: {
                users: usersData
            }
        }
    } catch (error) {
        logger.error(FILE_NAME, 'getUsersInformation', requestId, {
            error,
            errorMessage: error.message,
            errorStack: error.stack
        });
        return {
            error: true,
            errorData: {
                statusCode: 404,
                body: {
                    message: 'Oops something went wrong! Could not retrieve user information.'
                }
            }
        }
    }
}

export async function createUserInformation(data, requestId) {
    try {

        const createUserResponse = await UserInformation.create(data);
        const plainData = createUserResponse.get({ plain: true });

        if (!plainData || !plainData.id) {
            return {
                error: true,
                errorData: {
                    statusCode: 404,
                    body: {
                        message: 'User Information could not be created.'
                    }
                }
            }
        }

        return {
            error: false,
            data: {
                userResponse: plainData
            }
        }
    } catch (error) {
        logger.error(FILE_NAME, 'createUserInformation', requestId, {
            error,
            errorMessage: error.message,
            errorStack: error.stack
        });
        return {
            error: true,
            errorData: {
                statusCode: 400,
                body: {
                    message: 'Could not create User Information'
                }
            }
        }
    }
}

export async function updateUserInformation(where, data, requestId, upsert = false) {
    try {
        
        if (!where) {
            throw DB_ERRORS.DB_01;
        }

        if (!data.updated_at) {
            data.updated_at = new Date().toISOString();
        }
       
        if (upsert) {
            const upsertUserResponse = await UserInformation.upsert(
                { ...where, ...data }, 
                { returning: true, raw: true }
            )
    
            if (!upsertUserResponse || !upsertUserResponse[0].id) {
                return {
                    error: true,
                    errorData: {
                        statusCode: 404,
                        body: {
                            message: 'User Information could not be updated.'
                        }
                    }
                }
            }
    
            return {
                error: false,
                data: {
                    userResponse: upsertUserResponse[0]
                }
            }
        } else {
            const [affectedCount, affectedRows] = await UserInformation.update(
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
                            message: 'User Information could not be updated.'
                        }
                    }
                }
            }
    
            return {
                error: false,
                data: {
                    userResponse: affectedRows[0]
                }
            }
        }
    } catch (error) {
        logger.error(FILE_NAME, 'updateUserInformation', requestId, {
            error,
            errorMessage: error.message,
            errorStack: error.stack
        });
        return {
            error: true,
            errorData: {
                statusCode: 400,
                body: {
                    message: 'Could not update User Information'
                }
            }
        }
    }
}