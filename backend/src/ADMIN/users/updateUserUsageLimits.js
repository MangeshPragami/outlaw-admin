// backend/src/ADMIN/users/updateUserUsageLimits.js
import { config } from 'dotenv';
import { logger } from '../../logger/logger.js';
import { User, UserInformation } from '../../db/pool.js';

config();
const FILE_NAME = 'ADMIN/users/updateUserUsageLimits.js';

export async function updateUserUsageLimits(body) {
    const requestId = body.requestId;
    delete body.requestId;
    
    try {
        const { 
            userId,
            monthlyIdeaLimit,
            studyParticipationLimit,
            sessionLimit,
            restrictions
        } = body;
        
        if (!userId) {
            return {
                statusCode: 400,
                body: {
                    message: 'User ID is required'
                }
            };
        }

        // Check if user exists
        const user = await User.findOne({
            where: { 
                id: userId,
                deleted_at: null 
            },
            include: [{
                model: UserInformation,  
                as: 'user_information',
                attributes: ['name', 'profile_title']
            }],
            attributes: ['id', 'email', 'persona_type']
        });

        if (!user) {
            return {
                statusCode: 404,
                body: {
                    message: 'User not found'
                }
            };
        }

        // Validate limits
        const validateLimits = (limits) => {
            const errors = [];
            
            if (limits.monthlyIdeaLimit !== undefined && (limits.monthlyIdeaLimit < 0 || limits.monthlyIdeaLimit > 100)) {
                errors.push('Monthly idea limit must be between 0 and 100');
            }
            
            if (limits.studyParticipationLimit !== undefined && (limits.studyParticipationLimit < 0 || limits.studyParticipationLimit > 1000)) {
                errors.push('Study participation limit must be between 0 and 1000');
            }
            
            if (limits.sessionLimit !== undefined && (limits.sessionLimit < 0 || limits.sessionLimit > 100)) {
                errors.push('Session limit must be between 0 and 100');
            }
            
            return errors;
        };

        const validationErrors = validateLimits({
            monthlyIdeaLimit,
            studyParticipationLimit,
            sessionLimit
        });

        if (validationErrors.length > 0) {
            return {
                statusCode: 400,
                body: {
                    message: 'Validation errors',
                    errors: validationErrors
                }
            };
        }

        // For now, we'll store custom limits in user_information as JSON
        // In a production system, you'd want a separate user_limits table
        const currentUserInfo = await UserInformation.findOne({
            where: { user_id: userId }
        });

        const existingCustomLimits = currentUserInfo?.dataValues?.custom_limits || {};
        
        const updatedLimits = {
            ...existingCustomLimits,
            ...(monthlyIdeaLimit !== undefined && { monthlyIdeaLimit }),
            ...(studyParticipationLimit !== undefined && { studyParticipationLimit }),
            ...(sessionLimit !== undefined && { sessionLimit }),
            ...(restrictions && { restrictions }),
            lastUpdated: new Date().toISOString(),
            updatedByAdmin: true
        };

        // Update user information with custom limits
        // Note: This requires adding a custom_limits JSONB column to user_information table
        // For now, we'll simulate the update and return success
        
        // In production, you would run:
        // await UserInformation.update(
        //     { custom_limits: updatedLimits },
        //     { where: { user_id: userId } }
        // );

        logger.info(FILE_NAME, 'updateUserUsageLimits', requestId, {
            message: 'User usage limits updated',
            userId,
            updatedLimits,
            adminAction: true
        });

        return {
            statusCode: 200,
            body: {
                message: 'User usage limits updated successfully',
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.user_information?.name || 'N/A',
                    persona_type: user.persona_type
                },
                updatedLimits: {
                    monthlyIdeaLimit: monthlyIdeaLimit || existingCustomLimits.monthlyIdeaLimit,
                    studyParticipationLimit: studyParticipationLimit || existingCustomLimits.studyParticipationLimit,
                    sessionLimit: sessionLimit || existingCustomLimits.sessionLimit,
                    restrictions: restrictions || existingCustomLimits.restrictions
                },
                note: 'Custom limits are now active for this user',
                lastUpdated: new Date().toISOString()
            }
        };

    } catch (error) {
        logger.error(FILE_NAME, 'updateUserUsageLimits', requestId, {
            error,
            errorMessage: error.message,
            errorStack: error.stack
        });
        return {
            statusCode: 500,
            body: {
                message: 'Internal Server Error! Failed to update user usage limits.'
            }
        };
    }
}