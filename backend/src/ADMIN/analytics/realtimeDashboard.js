// backend/src/ADMIN/analytics/realtimeDashboard.js
import { config } from 'dotenv';
import { logger } from '../../logger/logger.js';
import { User, Idea, FormResponse } from '../../db/pool.js';
import { Op } from 'sequelize';

config();
const FILE_NAME = 'analytics/realtimeDashboard.js';

export async function realtimeDashboard(body) {
    const requestId = body.requestId;
    delete body.requestId;
    
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Query 1: Today's activity summary (matching your today's stats logic)
        const todayStats = await User.findOne({
            attributes: [
                [User.sequelize.literal(`(SELECT COUNT(*)::INTEGER FROM users WHERE DATE(created_at) = CURRENT_DATE)`), 'new_users_today'],
                [User.sequelize.literal(`(SELECT COUNT(*)::INTEGER FROM ideas WHERE DATE(created_at) = CURRENT_DATE)`), 'new_ideas_today'],
                [User.sequelize.literal(`(SELECT COUNT(*)::INTEGER FROM form_responses WHERE DATE(created_at) = CURRENT_DATE)`), 'new_responses_today']
            ],
            raw: true
        });

        // Query 2: Recent activity (matching your UNION ALL logic)
        const userActivity = await User.findAll({
            attributes: [
                [User.sequelize.literal("'user'"), 'type'],
                'created_at',
                'email'
            ],
            order: [['created_at', 'DESC']],
            limit: 5,
            raw: true
        });

        const ideaActivity = await Idea.findAll({
            attributes: [
                [Idea.sequelize.literal("'idea'"), 'type'],
                'created_at',
                'name'
            ],
            order: [['created_at', 'DESC']],
            limit: 5,
            raw: true
        });

        // Combine and sort activities (mimicking UNION ALL + ORDER BY)
        const recentActivity = [...userActivity, ...ideaActivity]
            .map(item => ({
                type: item.type,
                created_at: item.created_at,
                description: item.email || item.name
            }))
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(0, 10);

        return {
            statusCode: 200,
            body: {
                today: {
                    new_users_today: parseInt(todayStats.new_users_today || 0),
                    new_ideas_today: parseInt(todayStats.new_ideas_today || 0),
                    new_responses_today: parseInt(todayStats.new_responses_today || 0)
                },
                recentActivity: recentActivity,
                message: 'Realtime dashboard data retrieved successfully'
            }
        };
    } catch (error) {
        logger.error(FILE_NAME, 'realtimeDashboard', requestId, {
            error,
            errorMessage: error.message,
            errorStack: error.stack
        });
        return {
            statusCode: 500,
            body: {
                message: 'Internal Server Error! Failed to get realtime dashboard data.',
            }
        };
    }
}