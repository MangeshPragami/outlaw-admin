// admin/users/getAllUsers.js
import { config } from 'dotenv';
import { getUsers } from '../../user/crud.js';
import { logger } from '../../logger/logger.js';
import { UserInformation, Idea } from '../../db/pool.js';
import { Op } from 'sequelize';

config();
const FILE_NAME = 'admin/users/getAllUsers.js';

export async function getAllUsers(body) {
    const requestId = body.requestId;
    delete body.requestId;
    
    try {
        // Build where clause for filtering
        const whereClause = {
            deleted_at: null // Only active users
        };
        
        // Add filters if provided in query params
        if (body.status) {
            if (body.status === 'verified') {
                whereClause.email_verified_at = { [Op.ne]: null };
            } else if (body.status === 'unverified') {
                whereClause.email_verified_at = null;
            }
        }
        
        if (body.persona_type) {
            whereClause.persona_type = body.persona_type;
        }
        
        if (body.period && body.period !== 'all') {
            const dateFilter = getDateFilter(body.period);
            if (dateFilter !== '1=1') {
                const daysAgo = getDaysFromPeriod(body.period);
                whereClause.created_at = {
                    [Op.gte]: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000)
                };
            }
        }

        const usersDataFromDB = await getUsers(
            whereClause,
            [
                {
                    model: UserInformation,
                    attributes: {
                        exclude: ['updated_at', 'created_at', 'id'],
                    },
                    as: 'user_information',
                    required: false
                },
                {
                    model: Idea,
                    as: 'ideas',
                    attributes: ['id', 'name'],
                    where: {
                        idea_capture: {
                            [Op.ne]: null,
                        },
                    },
                    required: false,
                }
            ],
            ['id', 'email', 'persona_type', 'created_at', 'email_verified_at', 'auth_type', 'temp_id', 'consented_at'],
            requestId
        );

        if (usersDataFromDB.error) {
            return usersDataFromDB.errorData;
        }

        const users = usersDataFromDB.data.users.map(user => ({
            id: user.id,
            email: user.email,
            persona_type: user.persona_type,
            created_at: user.created_at,
            email_verified_at: user.email_verified_at,
            auth_type: user.auth_type,
            temp_id: user.temp_id,
            consented_at: user.consented_at,
            verified_by_admin: !!user.email_verified_at, // For frontend compatibility
            name: user.user_information?.name,
            profile_title: user.user_information?.profile_title,
            country: user.user_information?.country,
            industry: user.user_information?.industry,
            age: user.user_information?.age,
            linkedin: user.user_information?.linkedin,
            ideas_count: user.ideas?.length || 0
        }));

        return {
            statusCode: 200,
            body: {
                users,
                total: users.length,
                message: 'Users retrieved successfully'
            }
        };
    } catch (error) {
        logger.error(FILE_NAME, 'getAllUsers', requestId, {
            error,
            errorMessage: error.message,
            errorStack: error.stack
        });
        return {
            statusCode: 500,
            body: {
                message: 'Internal Server Error! Failed to get users.',
            }
        };
    }
}

// Helper functions
function getDaysFromPeriod(period) {
    switch (period) {
        case 'today': return 1;
        case 'week': return 7;
        case 'month': return 30;
        case 'quarter': return 90;
        default: return 30;
    }
}

function getDateFilter(period) {
    switch (period) {
        case 'today':
            return `created_at >= CURRENT_DATE`;
        case 'week':
            return `created_at >= CURRENT_DATE - INTERVAL '7 days'`;
        case 'month':
            return `created_at >= CURRENT_DATE - INTERVAL '30 days'`;
        case 'quarter':
            return `created_at >= CURRENT_DATE - INTERVAL '90 days'`;
        default:
            return '1=1';
    }
}
