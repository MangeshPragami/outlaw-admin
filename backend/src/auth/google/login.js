import jwt from 'jsonwebtoken';
import { config } from 'dotenv';
import { OAuth2Client } from 'google-auth-library';
import {AUTH_TYPE} from "../../helper/constants.js";
import {Idea, UserInformation} from "../../db/pool.js";
import {getUser} from "../../user/crud.js";

config();

const FILE_NAME = '/auth/google/login.js';
const client = new OAuth2Client();

export async function googleLogin(body) {
    const requestId = body.requestId;
    const idToken = body.idToken;

    if (!idToken) {
        return {
            statusCode: 400,
            body: { message: 'Missing Google ID token' }
        };
    }

    try {
        const ticket = await client.verifyIdToken({
            idToken,
            audience: [
                '157045635713-gksuuq74mh9p67vckeqqvg4pvherjv8l.apps.googleusercontent.com',
                '157045635713-02jjqhpsm87pmaj613r6btnm60d608kr.apps.googleusercontent.com',
                '157045635713-kbd60h1pflq7mpng1bvv6a7bhur6br3k.apps.googleusercontent.com'
            ]
        });

        const payload = ticket.getPayload();
        const { email } = payload;

        if (!email) {
            return {
                statusCode: 400,
                body: { message: 'Google token does not contain a valid email' }
            };
        }

        const userDataFromDB = await getUser(
            {
                email,
                auth_type: AUTH_TYPE.GOOGLE,
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
                    attributes: ['id', 'name']
                }
            ],
            ['id', 'email_verified_at', 'password', 'persona_type', 'email', 'auth_type', 'consented_at'],
            requestId
        );

        if (userDataFromDB.error) {
            if (userDataFromDB.errorData.statusCode === 404) {
                return {
                    statusCode: 404,
                    body: { message: 'User not found. Please sign up first.' }
                };
            }
            return userDataFromDB.errorData;
        }

        const userData = userDataFromDB.data.user;

        const token = jwt.sign(
            { userId: userData.id },
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
                ideas: userData.ideas.length,
                consented_at: userData?.consented_at,
                message: 'Login successful'
            }
        };
    } catch (error) {
        logger.error(FILE_NAME, 'googleLogin', requestId, {
            error,
            errorMessage: error.message,
            errorStack: error.stack
        });
        return {
            statusCode: 401,
            body: {
                message: 'Invalid or expired Google token',
                error: error.message
            }
        };
    }
}
