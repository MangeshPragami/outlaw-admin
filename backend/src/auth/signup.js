import bcrypt from 'bcrypt';
import { Op } from 'sequelize';
import { config } from 'dotenv';
import { randomUUID } from 'crypto';
import { logger } from '../logger/logger.js';
import {generateRandom} from '../helper/helper.js';
import { sendEmail } from '../helper/AWS/ses.js';
import {createUser, getUser, saveOtp} from '../user/crud.js';
import { signupValidation } from '../joi/validation.js';
import { AUTH_TYPE, EMAIL_USE_CASES, USER_ROLES } from '../helper/constants.js';
config();

const BCRYPT_SALT = +process.env.BCRYPT_SALT;
const FILE_NAME = 'signup.js';

export async function signup(body) {
    const requestId = body.requestId;
    delete body.requestId;
    
    try {

        const { headerError, bodyError } = signupValidation(body);
        if (headerError || bodyError) {
            return {
                statusCode: 400,
                body: {
                    message: 'Oops! Something went wrong.',
                    error: 'Invalid payload ' + (headerError || bodyError.details.map(d => d.message).join('; '))
                }
            }
        }
    
        const { email, password } = body;
        const userDataFromDB = await getUser(
            {
                email,
                auth_type: {
                    [Op.in]: [AUTH_TYPE.EMAIL, AUTH_TYPE.GOOGLE]
                },
                deleted_at: null
            },
            null,
            ['id', 'email'],
            requestId
        );
    
        if (userDataFromDB.error) {
            if (userDataFromDB.errorData.statusCode !== 404) {
                return userDataFromDB.errorData;
            }
        }

        const userData = userDataFromDB?.data?.user;
    
        if (userData) {
            return {
                statusCode: 409,
                body: { message: 'Please Login!' }
            }
        }
    
        const hashedPassword = bcrypt.hashSync(password, BCRYPT_SALT);
        const tempUserId = randomUUID();
    
        const createdUserFromDB = await createUser(
            {
                email,
                password: hashedPassword,
                temp_id: tempUserId,
                auth_type: AUTH_TYPE.EMAIL,
                persona_type: USER_ROLES.NOT_SELECTED
            },
            requestId
        );

        if (createdUserFromDB.error) {
            return createdUserFromDB.errorData;
        }

        const createdUser = createdUserFromDB.data.userResponse;

        const userId = createdUser.id;
        const otp = await generateRandom(6);
        await saveOtp(userId, otp, requestId);
        await sendEmail([ email ], EMAIL_USE_CASES.OTP_VERIFICATION, { otp }, requestId);
    
        return {
            statusCode: 200,
            body: { message: 'Success', userId: createdUser.id }
        }
    } catch (error) {
        logger.error(FILE_NAME, 'signup', requestId, {
            error,
            errorMessage: error.message,
            errorStack: error.stack
        });
        return {
            statusCode: 500,
            body: {
                message: 'Internal Server Error! Could not complete signup, please try again later.'
            }
        }
    }
}
