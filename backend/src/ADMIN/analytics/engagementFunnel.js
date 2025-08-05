// backend/src/ADMIN/analytics/engagementFunnel.js
import { config } from 'dotenv';
import { logger } from '../../logger/logger.js';
import { User, UserInformation, Idea, Form, FormResponse } from '../../db/pool.js';

config();
const FILE_NAME = 'analytics/engagementFunnel.js';

export async function engagementFunnel(body) {
    const requestId = body.requestId;
    delete body.requestId;
    
    try {
        // Single query matching your exact funnel logic with JOINs
        const userJourney = await User.findOne({
            include: [
                {
                    model: UserInformation,
                    required: false,
                    attributes: []
                },
                {
                    model: Idea,
                    required: false,
                    attributes: []
                },
                {
                    model: Form,
                    as: 'CreatedForms',
                    required: false,
                    attributes: []
                },
                {
                    model: FormResponse,
                    as: 'FormResponses',
                    required: false,
                    attributes: []
                }
            ],
            attributes: [
                [User.sequelize.fn('COUNT', User.sequelize.fn('DISTINCT', User.sequelize.col('User.id'))), 'total_users'],
                [User.sequelize.fn('COUNT', User.sequelize.fn('DISTINCT', User.sequelize.col('UserInformation.user_id'))), 'users_with_profiles'],
                [User.sequelize.fn('COUNT', User.sequelize.fn('DISTINCT', User.sequelize.col('Ideas.user_id'))), 'users_with_ideas'],
                [User.sequelize.fn('COUNT', User.sequelize.fn('DISTINCT', User.sequelize.col('CreatedForms.creator_id'))), 'users_with_forms'],
                [User.sequelize.fn('COUNT', User.sequelize.fn('DISTINCT', User.sequelize.col('FormResponses.responder_id'))), 'users_with_responses']
            ],
            raw: true
        });

        return {
            statusCode: 200,
            body: {
                userJourney: {
                    total_users: parseInt(userJourney.total_users || 0),
                    users_with_profiles: parseInt(userJourney.users_with_profiles || 0),
                    users_with_ideas: parseInt(userJourney.users_with_ideas || 0),
                    users_with_forms: parseInt(userJourney.users_with_forms || 0),
                    users_with_responses: parseInt(userJourney.users_with_responses || 0)
                },
                message: 'Engagement funnel retrieved successfully'
            }
        };
    } catch (error) {
        logger.error(FILE_NAME, 'engagementFunnel', requestId, {
            error,
            errorMessage: error.message,
            errorStack: error.stack
        });
        return {
            statusCode: 500,
            body: {
                message: 'Internal Server Error! Failed to get engagement funnel.',
            }
        };
    }
}

