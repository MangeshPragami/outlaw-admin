// admin/users/createUser.js
import bcrypt from 'bcrypt';
import { config } from 'dotenv';
import { createUser } from '../../user/crud.js';
import { logger } from '../../logger/logger.js';
import { AUTH_TYPE, USER_ROLES } from '../../helper/constants.js';
import { generateRandom } from '../../helper/helper.js';

config();
const FILE_NAME = 'admin/users/createUser.js';

export async function adminCreateUser(body) {
    const requestId = body.requestId;
    delete body.requestId;
    
    try {
        const { email, password, name, persona_type, profile_title, country, industry, age, linkedin, isApproved } = body;
        
        // Validation
        if (!email || !password || !persona_type) {
            return {
                statusCode: 400,
                body: {
                    message: 'Email, password, and persona_type are required.'
                }
            };
        }
        
        if (!Object.values(USER_ROLES).includes(persona_type)) {
            return {
                statusCode: 400,
                body: {
                    message: 'Invalid persona_type. Must be one of: founder, sme, respondent, not_selected'
                }
            };
        }

        // Hash password
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        
        // Generate temp_id
        const tempId = await generateRandom(12);
        
        // Create user data
        const userData = {
            email,
            password: hashedPassword,
            temp_id: tempId,
            auth_type: AUTH_TYPE.EMAIL,
            persona_type,
            email_verified_at: isApproved ? new Date() : null, // Auto-verify if approved by admin
            consented_at: isApproved ? new Date() : null
        };

        const createUserResponse = await createUser(userData, requestId);
        
        if (createUserResponse.error) {
            return createUserResponse.errorData;
        }
        
        const newUser = createUserResponse.data.userResponse;
        
        // Create user information if profile data provided
        if (name || profile_title || country || industry || age || linkedin) {
            try {
                const { UserInformation } = await import('../../db/pool.js');
                await UserInformation.create({
                    user_id: newUser.id,
                    name: name || null,
                    profile_title: profile_title || null,
                    country: country || null,
                    industry: industry || null,
                    age: age || null,
                    linkedin: linkedin || null
                });
            } catch (profileError) {
                logger.warn(FILE_NAME, 'adminCreateUser', requestId, {
                    message: 'User created but profile creation failed',
                    error: profileError.message
                });
            }
        }

        return {
            statusCode: 201,
            body: {
                message: 'User created successfully',
                user: {
                    id: newUser.id,
                    email: newUser.email,
                    persona_type: newUser.persona_type,
                    email_verified_at: newUser.email_verified_at,
                    created_at: newUser.created_at
                }
            }
        };
    } catch (error) {
        logger.error(FILE_NAME, 'adminCreateUser', requestId, {
            error,
            errorMessage: error.message,
            errorStack: error.stack
        });
        return {
            statusCode: 500,
            body: {
                message: 'Internal Server Error! Failed to create user.',
            }
        };
    }
}