// backend/src/ADMIN/sme/getAllSMEApplications.js
import { config } from 'dotenv';
import { logger } from '../../logger/logger.js';
import { User, UserInformation } from '../../db/pool.js';
import { Op } from 'sequelize';

config();
const FILE_NAME = 'ADMIN/sme/getAllSMEApplications.js';

export async function getAllSMEApplications(body) {
    const requestId = body.requestId;
    delete body.requestId;
    
    try {
        const {
            page = 1,
            limit = 50,
            status_filter = 'all', // all, pending, verified, rejected
            search_term = ''
        } = body;

        // Build where clause for SME applications
        const whereClause = {
            persona_type: 'sme',
            deleted_at: null
        };

        // Filter by verification status
        if (status_filter === 'pending') {
            whereClause.verified_by_admin = null;
        } else if (status_filter === 'verified') {
            whereClause.verified_by_admin = true;
        } else if (status_filter === 'rejected') {
            whereClause.verified_by_admin = false;
        }

        // Search functionality
        const includeClause = [{
            model: UserInformation,
            required: false,
            attributes: ['name', 'industry', 'country', 'linkedin', 'github', 'profile_title', 'experience', 'description'],
            where: search_term ? {
                [Op.or]: [
                    { name: { [Op.iLike]: `%${search_term}%` } },
                    { industry: { [Op.iLike]: `%${search_term}%` } },
                    { profile_title: { [Op.iLike]: `%${search_term}%` } }
                ]
            } : {}
        }];

        // Add email search to main where clause if search term provided
        if (search_term) {
            whereClause[Op.or] = [
                { email: { [Op.iLike]: `%${search_term}%` } },
                { '$UserInformation.name$': { [Op.iLike]: `%${search_term}%` } }
            ];
        }

        // Pagination
        const offset = (parseInt(page) - 1) * parseInt(limit);

        // Fetch SME applications
        const { count, rows: smeApplications } = await User.findAndCountAll({
            where: whereClause,
            include: includeClause,
            attributes: [
                'id',
                'email',
                'temp_id',
                'auth_type',
                'persona_type',
                'created_at',
                'updated_at',
                'email_verified_at',
                'verified_by_admin'
            ],
            order: [['created_at', 'DESC']],
            limit: parseInt(limit),
            offset: offset,
            distinct: true
        });

        // Format response
        const formattedApplications = smeApplications.map(sme => ({
            id: sme.id,
            email: sme.email,
            temp_id: sme.temp_id,
            auth_type: sme.auth_type,
            persona_type: sme.persona_type,
            verified_by_admin: sme.verified_by_admin,
            email_verified_at: sme.email_verified_at,
            created_at: sme.created_at,
            updated_at: sme.updated_at,
            // Profile information
            name: sme.UserInformation?.name || null,
            industry: sme.UserInformation?.industry || null,
            country: sme.UserInformation?.country || null,
            linkedin: sme.UserInformation?.linkedin || null,
            github: sme.UserInformation?.github || null,
            profile_title: sme.UserInformation?.profile_title || null,
            experience: sme.UserInformation?.experience || null,
            description: sme.UserInformation?.description || null
        }));

        // Calculate pagination info
        const totalPages = Math.ceil(count / parseInt(limit));

        logger.info(FILE_NAME, 'getAllSMEApplications', requestId, {
            message: 'SME applications retrieved successfully',
            totalApplications: count,
            page: parseInt(page),
            limit: parseInt(limit),
            filters: { status_filter, search_term }
        });

        return {
            statusCode: 200,
            body: {
                message: 'SME applications retrieved successfully',
                data: formattedApplications,
                pagination: {
                    total: count,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: totalPages,
                    hasNextPage: parseInt(page) < totalPages,
                    hasPrevPage: parseInt(page) > 1
                }
            }
        };
    } catch (error) {
        logger.error(FILE_NAME, 'getAllSMEApplications', requestId, {
            error,
            errorMessage: error.message,
            errorStack: error.stack
        });
        return {
            statusCode: 500,
            body: {
                message: 'Internal Server Error! Failed to retrieve SME applications.',
            }
        };
    }
}
