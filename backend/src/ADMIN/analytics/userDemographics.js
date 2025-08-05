// backend/src/ADMIN/analytics/userDemographics.js
import { config } from 'dotenv';
import { logger } from '../../logger/logger.js';
import { User, UserInformation } from '../../db/pool.js';
import { Op } from 'sequelize';

config();
const FILE_NAME = 'analytics/userDemographics.js';

export async function userDemographics(body) {
    const requestId = body.requestId;
    delete body.requestId;
    
    try {
        // Query 1: Geographic distribution (matching your JOIN logic)
        const byCountry = await UserInformation.findAll({
            attributes: [
                'country',
                [UserInformation.sequelize.fn('COUNT', UserInformation.sequelize.col('UserInformation.id')), 'count'],
                [UserInformation.sequelize.fn('COUNT', UserInformation.sequelize.literal("CASE WHEN \"User\".\"persona_type\" = 'founder' THEN 1 END")), 'founders'],
                [UserInformation.sequelize.fn('COUNT', UserInformation.sequelize.literal("CASE WHEN \"User\".\"persona_type\" = 'sme' THEN 1 END")), 'smes'],
                [UserInformation.sequelize.fn('COUNT', UserInformation.sequelize.literal("CASE WHEN \"User\".\"persona_type\" = 'respondent' THEN 1 END")), 'respondents']
            ],
            include: [{
                model: User,
                attributes: [],
                required: true
            }],
            where: {
                country: { [Op.not]: null }
            },
            group: ['country'],
            order: [[UserInformation.sequelize.fn('COUNT', UserInformation.sequelize.col('UserInformation.id')), 'DESC']],
            limit: 15,
            raw: true
        });

        // Query 2: Industry distribution (matching your industry logic)
        const byIndustry = await UserInformation.findAll({
            attributes: [
                'industry',
                [UserInformation.sequelize.fn('COUNT', UserInformation.sequelize.col('UserInformation.id')), 'count'],
                [UserInformation.sequelize.fn('COUNT', UserInformation.sequelize.literal("CASE WHEN \"User\".\"persona_type\" = 'founder' THEN 1 END")), 'founders'],
                [UserInformation.sequelize.fn('COUNT', UserInformation.sequelize.literal("CASE WHEN \"User\".\"persona_type\" = 'sme' THEN 1 END")), 'smes']
            ],
            include: [{
                model: User,
                attributes: [],
                required: true
            }],
            where: {
                industry: { [Op.not]: null }
            },
            group: ['industry'],
            order: [[UserInformation.sequelize.fn('COUNT', UserInformation.sequelize.col('UserInformation.id')), 'DESC']],
            raw: true
        });

        // Query 3: Profile completion stats (matching your completion logic)
        const profileCompletion = await UserInformation.findOne({
            attributes: [
                [UserInformation.sequelize.fn('COUNT', UserInformation.sequelize.col('id')), 'total_profiles'],
                [UserInformation.sequelize.fn('COUNT', UserInformation.sequelize.literal("CASE WHEN name IS NOT NULL THEN 1 END")), 'with_name'],
                [UserInformation.sequelize.fn('COUNT', UserInformation.sequelize.literal("CASE WHEN industry IS NOT NULL THEN 1 END")), 'with_industry'],
                [UserInformation.sequelize.fn('COUNT', UserInformation.sequelize.literal("CASE WHEN country IS NOT NULL THEN 1 END")), 'with_country'],
                [UserInformation.sequelize.fn('COUNT', UserInformation.sequelize.literal("CASE WHEN linkedin IS NOT NULL THEN 1 END")), 'with_linkedin'],
                [UserInformation.sequelize.fn('COUNT', UserInformation.sequelize.literal("CASE WHEN cv_url IS NOT NULL THEN 1 END")), 'with_cv'],
                [UserInformation.sequelize.literal('CAST((COUNT(CASE WHEN name IS NOT NULL AND industry IS NOT NULL AND country IS NOT NULL THEN 1 END)::float / NULLIF(COUNT(*), 0) * 100) AS DECIMAL(5,2))'), 'completion_rate']
            ],
            raw: true
        });

        return {
            statusCode: 200,
            body: {
                byCountry: byCountry.map(item => ({
                    country: item.country,
                    count: parseInt(item.count),
                    founders: parseInt(item.founders || 0),
                    smes: parseInt(item.smes || 0),
                    respondents: parseInt(item.respondents || 0)
                })),
                byIndustry: byIndustry.map(item => ({
                    industry: item.industry,
                    count: parseInt(item.count),
                    founders: parseInt(item.founders || 0),
                    smes: parseInt(item.smes || 0)
                })),
                profileCompletion: {
                    total_profiles: parseInt(profileCompletion.total_profiles),
                    with_name: parseInt(profileCompletion.with_name),
                    with_industry: parseInt(profileCompletion.with_industry),
                    with_country: parseInt(profileCompletion.with_country),
                    with_linkedin: parseInt(profileCompletion.with_linkedin),
                    with_cv: parseInt(profileCompletion.with_cv),
                    completion_rate: parseFloat(profileCompletion.completion_rate)
                },
                message: 'User demographics retrieved successfully'
            }
        };
    } catch (error) {
        logger.error(FILE_NAME, 'userDemographics', requestId, {
            error,
            errorMessage: error.message,
            errorStack: error.stack
        });
        return {
            statusCode: 500,
            body: {
                message: 'Internal Server Error! Failed to get user demographics.',
            }
        };
    }
}