import bcrypt from 'bcrypt';
import { Op } from 'sequelize';
import jwt from 'jsonwebtoken';
import { config } from 'dotenv';
import {getUser, saveOtp} from '../user/crud.js';
import { logger } from '../logger/logger.js';
import {AUTH_TYPE, EMAIL_USE_CASES} from '../helper/constants.js';
import { loginValidation } from '../joi/validation.js';
import { Idea, UserInformation } from "../db/pool.js";
import {generateRandom} from "../helper/helper.js";
import {sendEmail} from "../helper/AWS/ses.js";
config();

const FILE_NAME = 'login.js';

export async function login(body) {

    const requestId = body.requestId;
    delete body.requestId;

    try {
        const { headerError, bodyError } = loginValidation(body);
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
            [
                {
                    model: UserInformation,
                    attributes: {
                        exclude: ['updated_at', 'created_at', 'id'],
                    },
                    as: 'user_information',
                },
                {
                    model: Idea,
                    as: 'ideas',
                    attributes: ['id', 'name'],
                    where: {
                        idea_capture: {
                            [Op.ne]: null,

                        },

                    },
                    required: false,
                }
            ],
            ['id', 'email_verified_at', 'password', 'persona_type', 'email', 'auth_type', 'consented_at'],
            requestId
        );

        if (userDataFromDB.error) {
            return userDataFromDB.errorData;
        }

        const userData = userDataFromDB.data.user;
        console.log('userData', userData)
        
        if (!userData.email_verified_at) {

            const userId = userData.id
            const otp = await generateRandom(6);
            await saveOtp(userId, otp, requestId);
            await sendEmail([ email ], EMAIL_USE_CASES.OTP_VERIFICATION, { otp }, requestId );

            return {
                statusCode: 400,
                body: {
                    message: 'Please verify email first!',
                    flag : "verify_email"
                }
            }
        }

        if (userData.auth_type !== AUTH_TYPE.EMAIL) {
            return {
                statusCode: 400,
                body: {
                    message: 'Email already associated with google login!'
                }
            }
        }

        const ok = bcrypt.compareSync(password, userData.password);

        if (!ok) {
            return {
                statusCode: 401,
                body: { message: 'Incorrect Password!' }
            }
        }

        const token = jwt.sign(
            {
                userId: userData.id,
                persona_type: userData?.persona_type // Include persona in JWT
            },
            process.env.JWT_SECRET_KEY,
            {
                expiresIn: process.env.JWT_EXPIRY
            }
        );

        return {
            statusCode: 200,
            body: {
                token,
                user_id: userData.id,
                persona_type: userData.persona_type,
                user_information: userData.user_information,
                email: userData.email,
                ideas: userData.ideas?.length,
                consented_at: userData?.consented_at,
                message: 'Success'
            }
        }
    } catch (error) {
        logger.error(FILE_NAME, 'login', requestId, {
            error,
            errorMessage: error.message,
            errorStack: error.stack
        });
        return {
            statusCode: 500,
            body: {
                message: 'Internal Server Error! Cannot login.'
            }
        }
    }
}
