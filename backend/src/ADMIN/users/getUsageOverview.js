// backend/src/ADMIN/users/getUsageOverview.js
import { config } from 'dotenv';
import { logger } from '../../logger/logger.js';
import { User, UserInformation, Idea, Booking, FormResponses } from '../../db/pool.js';
import { Op } from 'sequelize';

config();
const FILE_NAME = 'ADMIN/users/getUsageOverview.js';

export async function getUsageOverview(body, event) {
    const requestId = body.requestId;
    delete body.requestId;
    
    try {
        // Extract query parameters
        const personaType = event?.queryStringParameters?.personaType;
        const status = event?.queryStringParameters?.status;
        
        // Build where clause for filtering
        const whereClause = {
            deleted_at: null
        };
        
        if (personaType && ['founder', 'sme', 'respondent'].includes(personaType)) {
            whereClause.persona_type = personaType;
        }

        // Get current month start date
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        // Get all users with their usage data
        const users = await User.findAll({
            where: whereClause,
            include: [{
                model: UserInformation,
                as: 'user_information',
                attributes: ['name', 'profile_title', 'country', 'industry']
            }],
            attributes: ['id', 'email', 'persona_type', 'created_at'],
            order: [['created_at', 'DESC']]
        });

        // Calculate usage for each user
        const usersWithUsage = await Promise.all(users.map(async (user) => {
            const [ideasThisMonth, bookingsThisMonth, formResponsesThisMonth] = await Promise.all([
                Idea.count({
                    where: {
                        user_id: user.id,
                        created_at: { [Op.gte]: startOfMonth }
                    }
                }),
                
                Booking.count({
                    where: {
                        [Op.or]: [
                            { creator_id: user.id },
                            { participant_id: user.id }
                        ],
                        created_at: { [Op.gte]: startOfMonth }
                    }
                }),
                
                FormResponses.count({
                    where: {
                        responder_id: user.id,
                        created_at: { [Op.gte]: startOfMonth }
                    }
                })
            ]);

            // Get default limits based on persona type
            const getDefaultLimits = (personaType) => {
                switch (personaType) {
                    case 'founder':
                        return { monthlyIdeaLimit: 5, studyParticipationLimit: 20, sessionLimit: 10 };
                    case 'sme':
                        return { monthlyIdeaLimit: 0, studyParticipationLimit: 100, sessionLimit: 50 };
                    case 'respondent':
                        return { monthlyIdeaLimit: 0, studyParticipationLimit: 50, sessionLimit: 20 };
                    default:
                        return { monthlyIdeaLimit: 0, studyParticipationLimit: 0, sessionLimit: 0 };
                }
            };

            const limits = getDefaultLimits(user.persona_type);
            
            // Calculate status for each metric
            const calculateStatus = (current, limit) => {
                if (limit === 0) return 'not_applicable';
                const percentage = (current / limit) * 100;
                if (percentage >= 100) return 'over_limit';
                if (percentage >= 80) return 'at_risk';
                return 'normal';
            };

            const ideaStatus = calculateStatus(ideasThisMonth, limits.monthlyIdeaLimit);
            const participationStatus = calculateStatus(formResponsesThisMonth, limits.studyParticipationLimit);
            const sessionStatus = calculateStatus(bookingsThisMonth, limits.sessionLimit);

            // Determine overall status
            const overallStatus = [ideaStatus, participationStatus, sessionStatus].includes('over_limit') ? 'over_limit' :
                                [ideaStatus, participationStatus, sessionStatus].includes('at_risk') ? 'at_risk' : 'normal';

            return {
                id: user.id,
                email: user.email,
                name: user.user_information?.name || 'N/A',
                persona_type: user.persona_type,
                profile_title: user.user_information?.profile_title || 'N/A',
                country: user.user_information?.country || 'N/A',
                industry: user.user_information?.industry || 'N/A',
                member_since: user.created_at,
                usage: {
                    ideasThisMonth,
                    studyParticipationThisMonth: formResponsesThisMonth,
                    sessionsThisMonth: bookingsThisMonth
                },
                limits,
                status: {
                    overall: overallStatus,
                    ideas: ideaStatus,
                    participation: participationStatus,
                    sessions: sessionStatus
                },
                percentages: {
                    ideas: limits.monthlyIdeaLimit > 0 ? Math.round((ideasThisMonth / limits.monthlyIdeaLimit) * 100) : 0,
                    participation: limits.studyParticipationLimit > 0 ? Math.round((formResponsesThisMonth / limits.studyParticipationLimit) * 100) : 0,
                    sessions: limits.sessionLimit > 0 ? Math.round((bookingsThisMonth / limits.sessionLimit) * 100) : 0
                }
            };
        }));

        // Filter by status if provided
        let filteredUsers = usersWithUsage;
        if (status && ['normal', 'at_risk', 'over_limit', 'suspended'].includes(status)) {
            filteredUsers = usersWithUsage.filter(user => user.status.overall === status);
        }

        // Calculate summary statistics
        const summary = {
            totalUsers: filteredUsers.length,
            byStatus: {
                normal: filteredUsers.filter(u => u.status.overall === 'normal').length,
                at_risk: filteredUsers.filter(u => u.status.overall === 'at_risk').length,
                over_limit: filteredUsers.filter(u => u.status.overall === 'over_limit').length,
                suspended: 0 // Would be implemented with suspension system
            },
            byPersonaType: {
                founder: filteredUsers.filter(u => u.persona_type === 'founder').length,
                sme: filteredUsers.filter(u => u.persona_type === 'sme').length,
                respondent: filteredUsers.filter(u => u.persona_type === 'respondent').length
            },
            averageUsage: {
                ideasPerUser: filteredUsers.length > 0 ? Math.round(filteredUsers.reduce((sum, u) => sum + u.usage.ideasThisMonth, 0) / filteredUsers.length * 100) / 100 : 0,
                participationPerUser: filteredUsers.length > 0 ? Math.round(filteredUsers.reduce((sum, u) => sum + u.usage.studyParticipationThisMonth, 0) / filteredUsers.length * 100) / 100 : 0,
                sessionsPerUser: filteredUsers.length > 0 ? Math.round(filteredUsers.reduce((sum, u) => sum + u.usage.sessionsThisMonth, 0) / filteredUsers.length * 100) / 100 : 0
            }
        };

        return {
            statusCode: 200,
            body: {
                summary,
                filters: {
                    personaType: personaType || 'all',
                    status: status || 'all'
                },
                users: filteredUsers.slice(0, 100), // Limit to first 100 users for performance
                totalCount: filteredUsers.length,
                reportGeneratedAt: new Date().toISOString(),
                message: 'Usage overview retrieved successfully'
            }
        };

    } catch (error) {
        logger.error(FILE_NAME, 'getUsageOverview', requestId, {
            error,
            errorMessage: error.message,
            errorStack: error.stack
        });
        return {
            statusCode: 500,
            body: {
                message: 'Internal Server Error! Failed to get usage overview.'
            }
        };
    }
}