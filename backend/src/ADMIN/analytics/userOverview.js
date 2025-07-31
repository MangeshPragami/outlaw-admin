// backend/src/ADMIN/analytics/userOverview.js
import { config } from 'dotenv';
import { logger } from '../../logger/logger.js';
import { User } from '../../db/pool.js';
import { Op } from 'sequelize';

config();
const FILE_NAME = 'analytics/userOverview.js';

function getDateFilter(period) {
    const now = new Date();
    switch (period) {
        case 'today':
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            return { [Op.gte]: today };
        case 'week':
            return { [Op.gte]: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) };
        case 'month':
            return { [Op.gte]: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) };
        default:
            return null; // 'all' - no filter
    }
}

export async function userOverview(body) {
    const requestId = body.requestId;
    delete body.requestId;
    
    try {
        const { period = 'all' } = body;
        const dateFilter = getDateFilter(period);
        
        const whereClause = {};
        if (dateFilter) {
            whereClause.created_at = dateFilter;
        }

        // Query 1: Total users (matching your SQL logic)
        const totalUsers = await User.findOne({
            where: whereClause,
            attributes: [
                [User.sequelize.fn('COUNT', User.sequelize.col('id')), 'total_users']
            ],
            raw: true
        });

        // Query 2: Users by persona type (matching your GROUP BY logic)
        const byPersonaType = await User.findAll({
            where: whereClause,
            attributes: [
                'persona_type',
                [User.sequelize.fn('COUNT', User.sequelize.col('id')), 'count']
            ],
            group: ['persona_type'],
            raw: true
        });

        // Query 3: Email verification rate (matching your verification logic)
        const verification = await User.findOne({
            where: whereClause,
            attributes: [
                [User.sequelize.fn('COUNT', User.sequelize.col('id')), 'total_users'],
                [User.sequelize.fn('COUNT', User.sequelize.col('email_verified_at')), 'verified_users'],
                [User.sequelize.literal('CAST((COUNT(email_verified_at)::numeric / NULLIF(COUNT(*), 0) * 100) AS DECIMAL(5,2))'), 'verification_rate']
            ],
            raw: true
        });

        return {
            statusCode: 200,
            body: {
                totalUsers: {
                    total_users: parseInt(totalUsers.total_users)
                },
                byPersonaType: byPersonaType.map(item => ({
                    persona_type: item.persona_type,
                    count: parseInt(item.count)
                })),
                verification: {
                    total_users: parseInt(verification.total_users),
                    verified_users: parseInt(verification.verified_users),
                    verification_rate: parseFloat(verification.verification_rate)
                },
                message: 'User overview retrieved successfully'
            }
        };
    } catch (error) {
        logger.error(FILE_NAME, 'userOverview', requestId, {
            error,
            errorMessage: error.message,
            errorStack: error.stack
        });
        return {
            statusCode: 500,
            body: {
                message: 'Internal Server Error! Failed to get user overview.',
            }
        };
    }
}