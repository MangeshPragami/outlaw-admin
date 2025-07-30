import { config } from "dotenv";
import {deleteOtp, getUser, saveOtp} from "../user/crud.js";
import { logger } from "../logger/logger.js";
import { sendEmail } from "../helper/AWS/ses.js";
import { EMAIL_USE_CASES } from "../helper/constants.js";
import {
    generateRandom,
} from "../helper/helper.js";
config();

const FILE_NAME = 'resendOTP.js';
const RATE_LIMIT = +process.env.RATE_LIMIT || 5;

export async function resendOTP(body) {
    
    const email = body.email;
    delete body.userId;

    const requestId = body.requestId;
    delete body.requestId;
    
    try {
        const userDataFromDB = await getUser(
            { 
                email: email,
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

        console.log(userData.id)
        // Delete the OTP from db
        await deleteOtp(userData.id, requestId);
        const otp = await generateRandom(6);
        await saveOtp(userData.id, otp, requestId);
        await sendEmail([ userData.email ], EMAIL_USE_CASES.OTP_VERIFICATION, { otp }, requestId);

        return {
            statusCode: 200,
            body: { message: 'OTP re-sent to your email.' }
        }
    } catch (error) {
        logger.error(FILE_NAME, 'resendOTP', requestId, {
            error,
            errorMessage: error.message,
            errorStack: error.stack
        });
        return {
            statusCode: 500,
            body: {
                message: 'Internal Server Error! Could not resend OTP.'
            }
        }
    }
}
