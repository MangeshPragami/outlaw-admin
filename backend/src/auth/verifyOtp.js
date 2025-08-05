import { logger } from "../logger/logger.js";
import {deleteOtp, getOtp, getUser, updateUser} from "../user/crud.js";
import { verifyOTPValidation } from "../joi/validation.js";

const FILE_NAME = 'verifyOtp.js';

export async function verifyOtp(body) {    

    const requestId = body.requestId;
    delete body.requestId;
    
    try {

        const { headerError, bodyError } = verifyOTPValidation(body);
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
            ['id'],
            requestId
        );
        
        if (userDataFromDB.error) {
            return userDataFromDB.errorData;
        }
    
        const userData = userDataFromDB.data.user;
        const userId = userData.id;

        const otpResult = await getOtp(userId, body.otp, requestId);

        if (!otpResult || otpResult.error || !otpResult.data || !otpResult.data.otp) {
            return {
                statusCode: 400,
                body: {
                    message: 'Invalid OTP! Please try again.'
                }
            };
        }

        const { otp } = otpResult.data;

        if (otp.toString() !== body.otp?.toString()) {
            return {
                statusCode: 409,
                body: {
                    message: 'Invalid OTP!'
                }
            };
        }

        // Delete the OTP from db
        await deleteOtp(userId, requestId);
    
        const updateUserRes = await updateUser(
            {
                id: userData.id
            },
            {
                email_verified_at: new Date().toISOString()
            },
            requestId
        );
    
        if (updateUserRes.error) {
            return updateUserRes.errorData;
        }
    
        return {
            statusCode: 200,
            body: {
                message: 'Success'
            }
        }
    } catch (error) {
        logger.error(FILE_NAME, 'verifyOtp', requestId, {
            error,
            errorMessage: error.message,
            errorStack: error.stack
        });
        return {
            statusCode: 500,
            body: {
                message: 'Internal server error! Could not veriy OTP.'
            }
        }
    }
}
