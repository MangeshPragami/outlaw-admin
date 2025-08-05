// backend/src/ADMIN/sme/getAllApprovedSMEs.js
import { config } from 'dotenv';
import { logger } from '../../logger/logger.js';
import { User, UserInformation, Booking, FormResponse } from '../../db/pool.js';
import { Op } from 'sequelize';

config();
const FILE_NAME = 'ADMIN/sme/getAllApprovedSMEs.js';

export async function getAllApprovedSMEs(body) {
    const requestId = body.requestId;
    delete body.requestId;
    
    try {
        const {
            page = 1,
            limit = 50,
            status_filter = 'all', // all, active, suspended
            search_term = ''
        } = body;

        // Build where clause for approved SMEs
        const whereClause = {
            persona_type: 'sme',
            verified_by_admin: true,
            deleted_at: null
        };

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

        // Fetch approved SMEs with session statistics
        const { count, rows: approvedSMEs } = await User.findAndCountAll({
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

        // Get session statistics for each SME
        const smeIds = approvedSMEs.map(sme => sme.id);
        
        const sessionStats = await Booking.findAll({
            where: {
                [Op.or]: [
                    { creator_id: { [Op.in]: smeIds } },
                    { participant_id: { [Op.in]: smeIds } }
                ]
            },
            attributes: [
                [Booking.sequelize.literal('COALESCE(creator_id, participant_id)'), 'sme_id'],
                [Booking.sequelize.fn('COUNT', Booking.sequelize.col('id')), 'total_sessions'],
                [Booking.sequelize.fn('COUNT', Booking.sequelize.literal("CASE WHEN status = 'completed' THEN 1 END")), 'completed_sessions'],
                [Booking.sequelize.fn('AVG', Booking.sequelize.literal("EXTRACT(EPOCH FROM (end_time - start_time))/60")), 'avg_session_duration']
            ],
            group: [Booking.sequelize.literal('COALESCE(creator_id, participant_id)')],
            raw: true
        });

        // Get form response statistics
        const responseStats = await FormResponse.findAll({
            where: {
                responder_id: { [Op.in]: smeIds }
            },
            attributes: [
                'responder_id',
                [FormResponse.sequelize.fn('COUNT', FormResponse.sequelize.col('id')), 'total_responses']
            ],
            group: ['responder_id'],
            raw: true
        });

        // Create lookup maps
        const sessionStatsMap = {};
        sessionStats.forEach(stat => {
            sessionStatsMap[stat.sme_id] = {
                total_sessions: parseInt(stat.total_sessions),
                completed_sessions: parseInt(stat.completed_sessions),
                avg_session_duration: Math.round(parseFloat(stat.avg_session_duration) || 0)
            };
        });

        const responseStatsMap = {};
        responseStats.forEach(stat => {
            responseStatsMap[stat.responder_id] = {
                total_responses: parseInt(stat.total_responses)
            };
        });

        // Format response with session statistics
        const formattedSMEs = approvedSMEs.map(sme => ({
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
            description: sme.UserInformation?.description || null,
            // Statistics
            session_stats: sessionStatsMap[sme.id] || {
                total_sessions: 0,
                completed_sessions: 0,
                avg_session_duration: 0
            },
            response_stats: responseStatsMap[sme.id] || {
                total_responses: 0
            },
            // Mock SME data (you might want to create a separate table for this)
            sme_data: {
                expertise_areas: ['SaaS', 'AI', 'Fintech'], // Mock data
                hourly_rate: 150,
                status: 'active',
                availability_status: 'available'
            }
        }));

        // Apply status filter after formatting
        const filteredSMEs = status_filter === 'all' ? formattedSMEs : 
            formattedSMEs.filter(sme => {
                if (status_filter === 'active') return sme.sme_data.status === 'active';
                if (status_filter === 'suspended') return sme.sme_data.status === 'suspended';
                return true;
            });

        // Calculate pagination info
        const totalPages = Math.ceil(count / parseInt(limit));

        logger.info(FILE_NAME, 'getAllApprovedSMEs', requestId, {
            message: 'Approved SMEs retrieved successfully',
            totalSMEs: count,
            page: parseInt(page),
            limit: parseInt(limit),
            filters: { status_filter, search_term }
        });

        return {
            statusCode: 200,
            body: {
                message: 'Approved SMEs retrieved successfully',
                data: filteredSMEs,
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
        logger.error(FILE_NAME, 'getAllApprovedSMEs', requestId, {
            error,
            errorMessage: error.message,
            errorStack: error.stack
        });
        return {
            statusCode: 500,
            body: {
                message: 'Internal Server Error! Failed to retrieve approved SMEs.',
            }
        };
    }
}
