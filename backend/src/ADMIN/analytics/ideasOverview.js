// analytics/ideasOverview.js
import { config } from 'dotenv';
import { logger } from '../logger/logger.js';
import { Idea } from '../db/pool.js';
import { Op } from 'sequelize';

config();
const FILE_NAME = 'analytics/ideasOverview.js';

export async function ideasOverview(body) {
    const requestId = body.requestId;
    delete body.requestId;
    
    try {
        const { period = 'all' } = body;
        
        // Build date filter
        const whereClause = {};
        if (period !== 'all') {
            const dateFilter = getDateFilter(period);
            if (dateFilter) {
                whereClause.created_at = dateFilter;
            }
        }

        // Get total ideas
        const totalIdeas = await Idea.count({
            where: whereClause
        });

        // Get ideas by stage
        const ideasByStage = await Idea.findAll({
            where: whereClause,
            attributes: [
                'stage',
                [Idea.sequelize.fn('COUNT', Idea.sequelize.col('id')), 'count']
            ],
            group: ['stage'],
            raw: true
        });

        // Get attachment statistics
        const attachmentStats = await Idea.findAll({
            where: whereClause,
            attributes: [
                [Idea.sequelize.fn('COUNT', Idea.sequelize.col('id')), 'total_ideas'],
                [Idea.sequelize.fn('COUNT', Idea.sequelize.col('pitch_deck')), 'with_pitch_deck'],
                [Idea.sequelize.fn('COUNT', Idea.sequelize.col('voice_note')), 'with_voice_note'],
                [Idea.sequelize.fn('COUNT', Idea.sequelize.col('document')), 'with_document']
            ],
            raw: true
        });

        return {
            statusCode: 200,
            body: {
                total: { total_ideas: totalIdeas },
                byStage: ideasByStage,
                attachments: attachmentStats[0],
                message: 'Ideas overview retrieved successfully'
            }
        };
    } catch (error) {
        logger.error(FILE_NAME, 'ideasOverview', requestId, {
            error,
            errorMessage: error.message,
            errorStack: error.stack
        });
        return {
            statusCode: 500,
            body: {
                message: 'Internal Server Error! Failed to get ideas overview.',
            }
        };
    }
}
