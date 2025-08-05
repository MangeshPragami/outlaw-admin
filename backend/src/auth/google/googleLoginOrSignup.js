import jwt from 'jsonwebtoken';
import { config } from 'dotenv';
import { OAuth2Client } from 'google-auth-library';
import { AUTH_TYPE, USER_ROLES } from '../../helper/constants.js';
import { Idea, UserInformation } from '../../db/pool.js';
import { getUser, createUser } from '../../user/crud.js';
import {logger} from "../../logger/logger.js";

config();

const FILE_NAME = '/auth/google/googleLoginOrSignup.js';
const client = new OAuth2Client();

const GOOGLE_AUDIENCE = [
    '157045635713-gksuuq74mh9p67vckeqqvg4pvherjv8l.apps.googleusercontent.com',
    '157045635713-02jjqhpsm87pmaj613r6btnm60d608kr.apps.googleusercontent.com',
    '157045635713-kbd60h1pflq7mpng1bvv6a7bhur6br3k.apps.googleusercontent.com'
];

const USER_INCLUDES = [
    {
        model: UserInformation,
        attributes: { exclude: ['updated_at', 'created_at', 'id'] },
        as: 'user_information',
    },
    {
        model: Idea,
        as: 'ideas',
        attributes: ['id', 'name']
    }
];

const USER_ATTRIBUTES = [
    'id', 'email_verified_at', 'password', 'persona_type', 'email', 'auth_type', 'consented_at'
];

export async function googleLoginOrSignup(body) {
    const { requestId, idToken } = body;
    console.log('google login signup')

    if (!idToken) {
        return {
            statusCode: 400,
            body: { message: 'Missing Google ID token' }
        };
    }

    try {
        const ticket = await client.verifyIdToken({
            idToken,
            audience: GOOGLE_AUDIENCE
        });

        const payload = ticket.getPayload();
        const { email } = payload || {};

        if (!email) {
            return {
                statusCode: 400,
                body: { message: 'Google token does not contain a valid email' }
            };
        }

        // Try to get the user
        let userDataFromDB = await getUser(
            { email, auth_type: AUTH_TYPE.GOOGLE, deleted_at: null },
            USER_INCLUDES,
            USER_ATTRIBUTES,
            requestId
        );

        // If user not found, create and fetch again
        if (userDataFromDB.error && userDataFromDB.errorData.statusCode === 404) {
            const createResult = await createUser(
                {
                    email,
                    auth_type: AUTH_TYPE.GOOGLE,
                    persona_type: USER_ROLES.NOT_SELECTED,
                },
                requestId
            );
            if (createResult.error) return createResult.errorData;

            // Fetch the newly created user with includes
            userDataFromDB = await getUser(
                { email, auth_type: AUTH_TYPE.GOOGLE, deleted_at: null },
                USER_INCLUDES,
                USER_ATTRIBUTES,
                requestId
            );
            if (userDataFromDB.error) return userDataFromDB.errorData;
        } else if (userDataFromDB.error) {
            return userDataFromDB.errorData;
        }

        const user = userDataFromDB.data.user;

        const token = jwt.sign(
            { userId: user.id },
            process.env.JWT_SECRET_KEY,
            { expiresIn: process.env.JWT_EXPIRY }
        );

        return {
            statusCode: 200,
            body: {
                token,
                user_id: user.id,
                persona_type: user.persona_type,
                user_information: user.user_information,
                email: user.email,
                ideas: user.ideas.length,
                consented_at: user?.consented_at,
                message: 'Login successful'
            }
        };
    } catch (error) {
        if (typeof logger !== 'undefined') {
            logger.error(FILE_NAME, 'googleLoginOrSignup', body.requestId, {
                error,
                errorMessage: error.message,
                errorStack: error.stack
            });
        }
        return {
            statusCode: 401,
            body: {
                message: 'Invalid or expired Google token',
                error: error.message
            }
        };
    }
} 
