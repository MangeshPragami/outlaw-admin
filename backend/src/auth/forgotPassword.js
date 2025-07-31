import jwt from 'jsonwebtoken';
import { config } from "dotenv";
import {getUser} from "../user/crud.js";
import { logger } from '../logger/logger.js';
import { sendEmail } from "../helper/AWS/ses.js";
import { EMAIL_USE_CASES } from "../helper/constants.js";
import { forgotPasswordValidation } from '../joi/validation.js';
import {getForgotPasswordRateLimits} from "../helper/helper.js";
config();

const HOST = process.env.HOST;
const RATE_LIMIT = +process.env.RATE_LIMIT || 5;
const FORGOT_PASSWORD_JWT_EXPIRY = +process.env.FORGOT_PASSWORD_JWT_EXPIRY;

const FILE_NAME = 'forgotPassword.js';

export async function forgotPassword(body) {

    const requestId = body.requestId;
    delete body.requestId;
    
    try {

        const { headerError, bodyError } = forgotPasswordValidation(body);
        if (headerError || bodyError) {
            return {
                statusCode: 400,
                body: {
                    message: 'Oops! Something went wrong.',
                    error: 'Invalid payload ' + (headerError || bodyError.details.map(d => d.message).join('; '))
                }
            }
        }
        
        const userDataFromDB = await getUser(
            { 
                email: body.email,
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

        // const cachedRateLimit = await getForgotPasswordRateLimits(userData.email);
        //
        // if (+cachedRateLimit >= RATE_LIMIT) {
        //     return {
        //         statusCode: 429,
        //         body: {
        //             message: 'You have exceeded the forgot password limit. Please try again later.'
        //         }
        //     }
        // }

        const token = jwt.sign(
            {
                userId: userData.id
            }, 
            process.env.FORGOT_PASSWORD_JWT_SECRET_KEY,
            {
                expiresIn: FORGOT_PASSWORD_JWT_EXPIRY
            }
        );
        await sendEmail([ userData.email ], EMAIL_USE_CASES.FORGOT_PASSWORD, { link: HOST + '/reset-password-link?token=' + token }, requestId);
        
        return {
            statusCode: 200,
            body: { message: 'Forgot password mail sent to your email.' }
        }
    } catch (error) {
        logger.error(FILE_NAME, 'forgotPassword', requestId, {
            error,
            errorMessage: error.message,
            errorStack: error.stack
        });
        return {
            statuCode: 500,
            body: {
                message: 'Internal Server Error! Could not send Forgot password.'
            }
        }
    }
}
