// backend/src/ADMIN/analytics/smeOverview.js
import { config } from 'dotenv';
import { logger } from '../../logger/logger.js';
import { User, UserInformation, FormResponse } from '../../db/pool.js';
import { Op } from 'sequelize';

config();
const FILE_NAME = 'analytics/smeOverview.js';

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
            return null;
    }
}

export async function smeOverview(body) {
    const requestId = body.requestId;
    delete body.requestId;
    
    try {
        const { period = 'all' } = body;
        const dateFilter = getDateFilter(period);
        
        const whereClause = {};
        if (dateFilter) {
            whereClause.created_at = dateFilter;
        }

        // Query 1: SME basic metrics (matching your LEFT JOIN logic)
        const smeStats = await User.findOne({
            where: whereClause,
            include: [{
                model: FormResponse,
                as: 'FormResponses',
                required: false,
                attributes: [],
                where: {
                    [Op.and]: [
                        User.sequelize.where(User.sequelize.col('User.persona_type'), 'sme')
                    ]
                }
            }],
            attributes: [
                [User.sequelize.fn('COUNT', User.sequelize.literal("CASE WHEN \"User\".\"persona_type\" = 'sme' THEN 1 END")), 'total_smes'],
                [User.sequelize.fn('COUNT', User.sequelize.literal("CASE WHEN \"User\".\"persona_type\" = 'sme' AND \"User\".\"email_verified_at\" IS NOT NULL THEN 1 END")), 'verified_smes'],
                [User.sequelize.fn('COUNT', User.sequelize.fn('DISTINCT', User.sequelize.col('FormResponses.responder_id'))), 'responding_smes']
            ],
            raw: true
        });

        // Query 2: SME by industry (matching your industry JOIN logic)
        const smeByIndustry = await UserInformation.findAll({
            attributes: [
                'industry',
                [UserInformation.sequelize.fn('COUNT', UserInformation.sequelize.col('UserInformation.id')), 'sme_count']
            ],
            include: [{
                model: User,
                where: {
                    persona_type: 'sme'
                },
                attributes: [],
                required: true
            }],
            where: {
                industry: { [Op.not]: null }
            },
            group: ['industry'],
            order: [[UserInformation.sequelize.fn('COUNT', UserInformation.sequelize.col('UserInformation.id')), 'DESC']],
            limit: 10,
            raw: true
        });

        return {
            statusCode: 200,
            body: {
                overview: {
                    total_smes: parseInt(smeStats.total_smes || 0),
                    verified_smes: parseInt(smeStats.verified_smes || 0),
                    responding_smes: parseInt(smeStats.responding_smes || 0)
                },
                byIndustry: smeByIndustry.map(item => ({
                    industry: item.industry,
                    sme_count: parseInt(item.sme_count)
                })),
                message: 'SME overview retrieved successfully'
            }
        };
    } catch (error) {
        logger.error(FILE_NAME, 'smeOverview', requestId, {
            error,
            errorMessage: error.message,
            errorStack: error.stack
        });
        return {
            statusCode: 500,
            body: {
                message: 'Internal Server Error! Failed to get SME overview.',
            }
        };
    }
}
