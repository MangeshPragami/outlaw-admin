import { Op } from 'sequelize';
import { config } from 'dotenv';
import { randomUUID } from 'crypto';
import { logger } from '../../logger/logger.js';
import { OAuth2Client } from 'google-auth-library';
import { getUser, createUser } from '../../user/crud.js';
import { AUTH_TYPE, USER_ROLES } from '../../helper/constants.js';

config();

const client = new OAuth2Client();
const FILE_NAME = '/auth/google/signup.js';

export async function googleSignup(body) {
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

        console.log('ticket', ticket);

        const payload = ticket.getPayload();
        const { email, name } = payload;

        if (!email) {
            return {
                statusCode: 400,
                body: { message: 'Email not found in Google token' }
            };
        }

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
                body: { message: 'User already exists. Please login.' }
            };
        }

        const tempUserId = randomUUID();

        const createdUserFromDB = await createUser(
            {
                email,
                temp_id: tempUserId,
                auth_type: AUTH_TYPE.GOOGLE,
                persona_type: USER_ROLES.NOT_SELECTED,
            },
            requestId
        );

        if (createdUserFromDB.error) {
            return createdUserFromDB.errorData;
        }

        const createdUser = createdUserFromDB.data.userResponse;

        return {
            statusCode: 200,
            body: {
                message: 'Signup successful',
                userId: createdUser.id
            }
        };
    } catch (error) {
        logger.error(FILE_NAME, 'googleSignup', requestId, {
            error,
            errorMessage: error.message,
            errorStack: error.stack
        });
        return {
            statusCode: 401,
            body: {
                message: 'Invalid Google token',
                error: error.message
            }
        };
    }
}
