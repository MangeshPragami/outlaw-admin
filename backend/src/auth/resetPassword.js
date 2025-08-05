import bcrypt from 'bcrypt';
import { config } from "dotenv";
import { logger } from '../logger/logger.js';
import { AUTH_TYPE } from "../helper/constants.js";
import { getUser, updateUser } from "../user/crud.js";
import { resetPasswordValidation } from '../joi/validation.js';
import { getResetPasswordCacheKey} from "../helper/helper.js";
config();

const BCRYPT_SALT = +process.env.BCRYPT_SALT;
const FORGOT_PASSWORD_JWT_EXPIRY = +process.env.FORGOT_PASSWORD_JWT_EXPIRY;
const FORGOT_PASSWORD_JWT_SECRET_KEY = process.env.FORGOT_PASSWORD_JWT_SECRET_KEY;

const FILE_NAME = 'resetPassword.js';

export async function resetPassword(body) {
    
    const token = body.token;
    delete body.token;

    const requestId = body.requestId;
    delete body.requestId;
    
    try {
        const { headerError, bodyError } = resetPasswordValidation(body);
        if (headerError || bodyError) {
            return {
                statusCode: 400,
                body: {
                    message: 'Oops! Something went wrong.',
                    error: 'Invalid payload ' + (headerError || bodyError.details.map(d => d.message).join('; '))
                }
            }
        }
        
        if (!token) {
            return {
                statusCode: 401,
                body: {
                    error: 'Unauthorized Request! Auth Token missing'
                }
            };
        }

        const decoded = jwt.verify(token, FORGOT_PASSWORD_JWT_SECRET_KEY);

        if (decoded.iat >= decoded.exp) {
            return {
                statusCode: 401,
                body: {
                    error: 'Unauthorized Request! Auth Token expired'
                }
            };
        }

        const userId = decoded.userId;
        if (!userId) {
            return {
                statusCode: 401,
                body: {
                    error: 'Unauthorized Request! Auth Token expired'
                }
            };
        }

        const userDataFromDB = await getUser(
            { 
                id: userId,
                deleted_at: null
            },
            null,
            ['id', 'email'],
            requestId
        );
    
        if (userDataFromDB.error) {
            return userDataFromDB.errorData;
        }

        const userData = userDataFromDB.data.user;

        if (userData.auth_type === AUTH_TYPE.GOOGLE) {
            return {
                statusCode: 409,
                body: {
                    message: 'The associated email is linked to an existing google account, cannot reset password'
                }
            }
        }

        const redisKey = getResetPasswordCacheKey(userData.email);
        const resetPasswordCache = await cache.get(redisKey);

        if (Boolean(resetPasswordCache) === true) {
            return {
                statusCode: 409,
                body: {
                    message: 'Password has already been reset for this link.'
                }
            }
        }

        await cache.set(redisKey, true, 'EX', FORGOT_PASSWORD_JWT_EXPIRY);

        const hashedPassword = bcrypt.hashSync(body.password, BCRYPT_SALT);

        const updateUserRes = await updateUser(
            {
                id: userId
            },
            {
                password: hashedPassword
            },
            requestId
        )

        if (updateUserRes.error) {
            return updateUserRes.errorData;
        }
        
        return {
            statusCode: 200,
            body: { message: 'Password reset!' }
        }
    } catch (error) {
        logger.error(FILE_NAME, 'resetPassword', requestId, {
            error,
            errorMessage: error.message,
            errorStack: error.stack
        });
        return {
            statuCode: 500,
            body: {
                message: 'Internal Server Error! Password Reset failed.'
            }
        }
    }
}