// backend/src/ADMIN/users/getUserUsageLimits.js
import { config } from 'dotenv';
import { logger } from '../../logger/logger.js';
import { User, UserInformation, Idea, Booking, FormResponses } from '../../db/pool.js';
import { Op } from 'sequelize';

config();
const FILE_NAME = 'ADMIN/users/getUserUsageLimits.js';

export async function getUserUsageLimits(body) {
    const requestId = body.requestId;
    delete body.requestId;
    
    try {
        const { userId } = body;
        
        if (!userId) {
            return {
                statusCode: 400,
                body: {
                    message: 'User ID is required'
                }
            };
        }

        // Get user basic info
        const user = await User.findOne({
            where: { 
                id: userId,
                deleted_at: null 
            },
            include: [{
                model: UserInformation,
                as: 'user_information',
                attributes: ['name', 'profile_title', 'country', 'industry']
            }],
            attributes: ['id', 'email', 'persona_type', 'created_at']
        });

        if (!user) {
            return {
                statusCode: 404,
                body: {
                    message: 'User not found'
                }
            };
        }

        // Calculate current month usage
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const [ideasThisMonth, bookingsThisMonth, formResponsesThisMonth, totalIdeas, totalBookings, totalResponses] = await Promise.all([
            // Ideas created this month
            Idea.count({
                where: {
                    user_id: userId,
                    created_at: { [Op.gte]: startOfMonth }
                }
            }),
            
            // Bookings/sessions this month
            Booking.count({
                where: {
                    [Op.or]: [
                        { creator_id: userId },
                        { participant_id: userId }
                    ],
                    created_at: { [Op.gte]: startOfMonth }
                }
            }),
            
            // Form responses this month
            FormResponses.count({
                where: {
                    responder_id: userId,
                    created_at: { [Op.gte]: startOfMonth }
                }
            }),
            
            // Total lifetime counts
            Idea.count({
                where: { user_id: userId }
            }),
            
            Booking.count({
                where: {
                    [Op.or]: [
                        { creator_id: userId },
                        { participant_id: userId }
                    ]
                }
            }),
            
            FormResponses.count({
                where: { responder_id: userId }
            })
        ]);

        // Define default limits based on persona type
        const getDefaultLimits = (personaType) => {
            switch (personaType) {
                case 'founder':
                    return {
                        monthlyIdeaLimit: 5,
                        studyParticipationLimit: 20,
                        sessionLimit: 10
                    };
                case 'sme':
                    return {
                        monthlyIdeaLimit: 0,
                        studyParticipationLimit: 100,
                        sessionLimit: 50
                    };
                case 'respondent':
                    return {
                        monthlyIdeaLimit: 0,
                        studyParticipationLimit: 50,
                        sessionLimit: 20
                    };
                default:
                    return {
                        monthlyIdeaLimit: 0,
                        studyParticipationLimit: 0,
                        sessionLimit: 0
                    };
            }
        };

        const defaultLimits = getDefaultLimits(user.persona_type);
        
        // Calculate usage status
        const calculateStatus = (current, limit) => {
            if (limit === 0) return 'not_applicable';
            const percentage = (current / limit) * 100;
            if (percentage >= 100) return 'over_limit';
            if (percentage >= 80) return 'at_risk';
            return 'normal';
        };

        const usageStatus = {
            ideas: calculateStatus(ideasThisMonth, defaultLimits.monthlyIdeaLimit),
            participation: calculateStatus(formResponsesThisMonth, defaultLimits.studyParticipationLimit),
            sessions: calculateStatus(bookingsThisMonth, defaultLimits.sessionLimit)
        };

        const overallStatus = Object.values(usageStatus).includes('over_limit') ? 'over_limit' :
                            Object.values(usageStatus).includes('at_risk') ? 'at_risk' : 'normal';

        return {
            statusCode: 200,
            body: {
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.user_information?.name || 'N/A',
                    persona_type: user.persona_type,
                    profile_title: user.user_information?.profile_title || 'N/A',
                    member_since: user.created_at
                },
                limits: {
                    monthlyIdeaLimit: defaultLimits.monthlyIdeaLimit,
                    studyParticipationLimit: defaultLimits.studyParticipationLimit,
                    sessionLimit: defaultLimits.sessionLimit
                },
                currentUsage: {
                    ideasThisMonth,
                    studyParticipationThisMonth: formResponsesThisMonth,
                    sessionsThisMonth: bookingsThisMonth
                },
                lifetimeUsage: {
                    totalIdeas,
                    totalStudyParticipation: totalResponses,
                    totalSessions: totalBookings
                },
                status: {
                    overall: overallStatus,
                    breakdown: usageStatus
                },
                restrictions: {
                    canSubmitIdeas: usageStatus.ideas !== 'over_limit',
                    canParticipateInStudies: usageStatus.participation !== 'over_limit',
                    canBookSessions: usageStatus.sessions !== 'over_limit',
                    suspendedUntil: null // Would be implemented with a separate suspension system
                },
                lastUpdated: new Date().toISOString(),
                message: 'User usage limits retrieved successfully'
            }
        };

    } catch (error) {
        logger.error(FILE_NAME, 'getUserUsageLimits', requestId, {
            error,
            errorMessage: error.message,
            errorStack: error.stack
        });
        return {
            statusCode: 500,
            body: {
                message: 'Internal Server Error! Failed to get user usage limits.'
            }
        };
    }
}