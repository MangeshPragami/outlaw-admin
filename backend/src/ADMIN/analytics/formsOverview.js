// backend/src/ADMIN/analytics/formsOverview.js
import { config } from 'dotenv';
import { logger } from '../../logger/logger.js';
import { Form, FormResponse } from '../../db/pool.js';
import { Op } from 'sequelize';

config();
const FILE_NAME = 'analytics/formsOverview.js';

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

export async function formsOverview(body) {
    const requestId = body.requestId;
    delete body.requestId;
    
    try {
        const { period = 'all' } = body;
        const dateFilter = getDateFilter(period);
        
        const whereClause = {};
        if (dateFilter) {
            whereClause.created_at = dateFilter;
        }

        // Query 1: Form stats (matching your form stats logic)
        const formStats = await Form.findOne({
            where: whereClause,
            attributes: [
                [Form.sequelize.fn('COUNT', Form.sequelize.col('id')), 'total_forms'],
                [Form.sequelize.fn('COUNT', Form.sequelize.literal("CASE WHEN form_url IS NOT NULL THEN 1 END")), 'forms_with_url']
            ],
            raw: true
        });

        // Query 2: Total responses (matching your response count logic)
        const responseStats = await FormResponse.findOne({
            where: whereClause,
            attributes: [
                [FormResponse.sequelize.fn('COUNT', FormResponse.sequelize.col('id')), 'total_responses']
            ],
            raw: true
        });

        // Query 3: Form completion rate (matching your completion logic)
        const completionStats = await Form.findOne({
            where: whereClause,
            include: [{
                model: FormResponse,
                required: false,
                attributes: []
            }],
            attributes: [
                [Form.sequelize.fn('COUNT', Form.sequelize.fn('DISTINCT', Form.sequelize.col('Form.id'))), 'total_forms'],
                [Form.sequelize.fn('COUNT', Form.sequelize.fn('DISTINCT', Form.sequelize.col('FormResponses.form_id'))), 'forms_with_responses'],
                [Form.sequelize.literal('CAST((COUNT(DISTINCT "FormResponses"."form_id")::numeric / NULLIF(COUNT(DISTINCT "Form"."id")::numeric, 0) * 100) AS DECIMAL(5,2))'), 'completion_rate']
            ],
            raw: true
        });

        return {
            statusCode: 200,
            body: {
                forms: {
                    total_forms: parseInt(formStats.total_forms),
                    forms_with_url: parseInt(formStats.forms_with_url)
                },
                totalResponses: {
                    total_responses: parseInt(responseStats.total_responses)
                },
                completion: {
                    total_forms: parseInt(completionStats.total_forms),
                    forms_with_responses: parseInt(completionStats.forms_with_responses),
                    completion_rate: parseFloat(completionStats.completion_rate)
                },
                message: 'Forms overview retrieved successfully'
            }
        };
    } catch (error) {
        logger.error(FILE_NAME, 'formsOverview', requestId, {
            error,
            errorMessage: error.message,
            errorStack: error.stack
        });
        return {
            statusCode: 500,
            body: {
                message: 'Internal Server Error! Failed to get forms overview.',
            }
        };
    }
}