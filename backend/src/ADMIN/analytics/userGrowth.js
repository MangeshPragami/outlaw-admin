// backend/src/ADMIN/analytics/userGrowth.js
import { config } from 'dotenv';
import { logger } from '../../logger/logger.js';
import { User } from '../../db/pool.js';
import { Op } from 'sequelize';

config();
const FILE_NAME = 'analytics/userGrowth.js';

export async function userGrowth(body) {
    const requestId = body.requestId;
    delete body.requestId;
    
    try {
        const { period = '30' } = body;
        const days = parseInt(period);
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        // Matching your exact SQL logic with cumulative calculation
        const growthData = await User.findAll({
            where: {
                created_at: { [Op.gte]: startDate }
            },
            attributes: [
                [User.sequelize.fn('DATE', User.sequelize.col('created_at')), 'date'],
                [User.sequelize.fn('COUNT', User.sequelize.col('id')), 'new_users'],
                [User.sequelize.fn('SUM', User.sequelize.fn('COUNT', User.sequelize.col('id'))), 'cumulative_users']
            ],
            group: [User.sequelize.fn('DATE', User.sequelize.col('created_at'))],
            order: [[User.sequelize.fn('DATE', User.sequelize.col('created_at')), 'ASC']],
            raw: true
        });

        return {
            statusCode: 200,
            body: growthData.map(item => ({
                date: item.date,
                new_users: parseInt(item.new_users),
                cumulative_users: parseInt(item.cumulative_users)
            }))
        };
    } catch (error) {
        logger.error(FILE_NAME, 'userGrowth', requestId, {
            error,
            errorMessage: error.message,
            errorStack: error.stack
        });
        return {
            statusCode: 500,
            body: {
                message: 'Internal Server Error! Failed to get user growth data.',
            }
        };
    }
}
