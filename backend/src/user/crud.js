import {Otp, User} from "../db/pool.js";
import { logger } from "../logger/logger.js";
import { DB_ERRORS } from "../helper/constants.js";

const FILE_NAME = 'user/crud.js';

export async function getUser(where, include, attributes, requestId) {
    try {

        if (!where) {
            throw DB_ERRORS.DB_01;
        }

        const queryObj = {
            where
        }

        if (include) {
            queryObj.include = include;
        }

        if (attributes && attributes.length) {
            queryObj.attributes = attributes;
        }

        const userData = await User.findOne(queryObj);

        if (!userData) {
            return {
                error: true,
                errorData: {
                    statusCode: 404,
                    body: {
                        message: 'User not found.'
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
        logger.error(FILE_NAME, 'getUser', requestId, {
            error,
            errorMessage: error.message,
            errorStack: error.stack
        });
        return {
            error: true,
            errorData: {
                statusCode: 404,
                body: {
                    message: 'Oops something went wrong! Could not retrieve user.'
                }
            }
        }
    }
}

export async function getUsers(where, include, attributes, requestId) {
    try {

        if (!where) {
            throw DB_ERRORS.DB_01;
        }

        const queryObj = {
            where,
            // raw: true
        }

        if (include) {
            queryObj.include = include;
        }

        if (attributes && attributes.length) {
            queryObj.attributes = attributes;
        }

        const usersData = await User.findAll(queryObj);

        if (!usersData || !usersData.length) {
            return {
                error: true,
                errorData: {
                    statusCode: 404,
                    body: {
                        message: 'Users not found.'
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
        logger.error(FILE_NAME, 'getUsers', requestId, {
            error,
            errorMessage: error.message,
            errorStack: error.stack
        });
        return {
            error: true,
            errorData: {
                statusCode: 404,
                body: {
                    message: 'Oops something went wrong! Could not retrieve user.'
                }
            }
        }
    }

}

export async function createUser(data, requestId) {
    try {

        const createUserResponse = await User.create(data);
        const plainData = createUserResponse.get({ plain: true });

        if (!plainData || !plainData.id) {
            return {
                error: true,
                errorData: {
                    statusCode: 404,
                    body: {
                        message: 'Users could not be created.'
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
        logger.error(FILE_NAME, 'createUser', requestId, {
            error,
            errorMessage: error.message,
            errorStack: error.stack
        });
        return {
            error: true,
            errorData: {
                statusCode: 400,
                body: {
                    message: 'Could not create User'
                }
            }
        }
    }
}

export async function updateUser(where, data, requestId) {
    try {
        
        if (!where) {
            throw DB_ERRORS.DB_01;
        }

        if (!data.updated_at) {
            data.updated_at = new Date().toISOString();
        }
       
        const [affectedCount, affectedRows] = await User.update(
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
                        message: 'Users could not be updated.'
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
    } catch (error) {
        console.log('error.message', error.message)
        logger.error(FILE_NAME, 'updateUser', requestId, {
            error,
            errorMessage: error.message,
            errorStack: error.stack
        });
        return {
            error: true,
            errorData: {
                statusCode: 400,
                body: {
                    message: 'Could not update User'
                }
            }
        }
    }
}

export async function saveOtp(user_id, otp, requestId) {
    try {
        if (!user_id || !otp) {
            return {
                error: true,
                errorData: {
                    statusCode: 400,
                    body: {
                        message: 'User ID and OTP are required.'
                    }
                }
            };
        }

        const EMAIL_OTP_EXPIRES_IN = +(process.env.EMAIL_OTP_EXPIRES_IN) || 900; // in seconds

        const expiresAt = new Date(Date.now() + EMAIL_OTP_EXPIRES_IN * 1000);

        const savedOtp = await Otp.create({
            user_id,
            otp,
            expires_at: expiresAt
        });

        return {
            error: false,
            data: savedOtp
        };
    } catch (error) {
        logger.error(FILE_NAME, "saveOtp", requestId, {
            error,
            errorMessage: error.message,
            errorStack: error.stack
        });

        return {
            error: true,
            errorData: {
                statusCode: 500,
                body: {
                    message: "Failed to save OTP."
                }
            }
        };
    }
}


export async function getOtp(user_id, otp, requestId = null) {
    try {
        if (!user_id || !otp) {
            return {
                error: true,
                errorData: {
                    statusCode: 400,
                    body: {
                        message: "User ID and OTP are required."
                    }
                }
            };
        }
        const result = await Otp.findOne({
            where: {
                user_id,
                otp: otp.toString()
            },
            order: [["created_at", "DESC"]]
        });

        const existingOtp = JSON.parse(JSON.stringify(result)) || {};

        return {
            error: false,
            data: existingOtp
        };
    } catch (error) {
        console.log("OTP Verification Error:", error.message);
        logger.error(FILE_NAME, "getOtp", requestId, {
            error,
            errorMessage: error.message,
            errorStack: error.stack
        });

        return {
            error: true,
            errorData: {
                statusCode: 500,
                body: {
                    message: "Failed to verify OTP."
                }
            }
        };
    }
}

export async function deleteOtp(user_id, requestId = null) {
    try {
        if (!user_id) {
            return {
                error: true,
                errorData: {
                    statusCode: 400,
                    body: {
                        message: "User ID is required."
                    }
                }
            };
        }

        const deleted = await Otp.destroy({
            where: {
                user_id
            }
        });

        if (deleted === 0) {
            return {
                error: true,
                errorData: {
                    statusCode: 404,
                    body: {
                        message: "OTP not found or already deleted."
                    }
                }
            };
        }

        return {
            error: false,
            data: {
                message: "OTP deleted successfully."
            }
        };
    } catch (error) {
        console.log("Delete OTP Error:", error.message);
        logger.error(FILE_NAME, "deleteOtp", requestId, {
            error,
            errorMessage: error.message,
            errorStack: error.stack
        });

        return {
            error: true,
            errorData: {
                statusCode: 500,
                body: {
                    message: "Failed to delete OTP."
                }
            }
        };
    }
}
