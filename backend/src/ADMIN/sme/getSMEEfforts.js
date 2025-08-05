// backend/src/ADMIN/sme/getSMEEfforts.js
import { config } from 'dotenv';
import { logger } from '../../logger/logger.js';
import { Booking, User, UserInformation } from '../../db/pool.js';
import { Op } from 'sequelize';

config();
const FILE_NAME = 'ADMIN/sme/getSMEEfforts.js';

export async function getSMEEfforts(body) {
    const requestId = body.requestId;
    delete body.requestId;
    
    try {
        const { 
            smeId,
            period = '30', // days
            include_preparation = true,
            include_followup = true
        } = body;

        if (!smeId) {
            return {
                statusCode: 400,
                body: {
                    message: 'SME ID is required',
                }
            };
        }

        // Date filter
        const days = parseInt(period);
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        // Get SME information
        const sme = await User.findOne({
            where: { id: smeId, persona_type: 'sme' },
            include: [{
                model: UserInformation,
                attributes: ['name', 'industry', 'profile_title']
            }]
        });

        if (!sme) {
            return {
                statusCode: 404,
                body: {
                    message: 'SME not found',
                }
            };
        }

        // Get booking/session data for the SME
        const sessions = await Booking.findAll({
            where: {
                [Op.or]: [
                    { creator_id: smeId },
                    { participant_id: smeId }
                ],
                start_time: { [Op.gte]: startDate }
            },
            attributes: [
                'id',
                'start_time',
                'end_time',
                'status',
                'virtual_conference_id',
                'transcript_url',
                'video_recording_url',
                [Booking.sequelize.literal("EXTRACT(EPOCH FROM (end_time - start_time))/60"), 'session_duration_minutes']
            ],
            order: [['start_time', 'DESC']],
            raw: true
        });

        // Calculate effort statistics
        const completedSessions = sessions.filter(s => s.status === 'completed');
        const totalSessionTime = completedSessions.reduce((sum, session) => {
            return sum + (parseFloat(session.session_duration_minutes) || 0);
        }, 0);

        // Mock preparation and follow-up time (you might want to track this separately)
        const avgPreparationTime = 15; // 15 minutes per session
        const avgFollowupTime = 10; // 10 minutes per session
        
        const totalEffortTime = totalSessionTime + 
            (completedSessions.length * avgPreparationTime) +
            (completedSessions.length * avgFollowupTime);

        // Format sessions with effort breakdown
        const formattedSessions = sessions.map(session => ({
            id: session.id,
            date: session.start_time ? new Date(session.start_time).toISOString().split('T')[0] : null,
            start_time: session.start_time,
            end_time: session.end_time,
            status: session.status,
            session_duration: Math.round(parseFloat(session.session_duration_minutes) || 0),
            preparation_time: avgPreparationTime, // Mock data
            followup_time: avgFollowupTime, // Mock data
            total_effort: Math.round((parseFloat(session.session_duration_minutes) || 0) + avgPreparationTime + avgFollowupTime),
            has_transcript: !!session.transcript_url,
            has_recording: !!session.video_recording_url
        }));

        // Calculate hourly rate and payout
        const hourlyRate = 150; // This should come from SME data
        const totalPayout = Math.round((totalEffortTime / 60) * hourlyRate);

        logger.info(FILE_NAME, 'getSMEEfforts', requestId, {
            message: 'SME efforts retrieved successfully',
            smeId: smeId,
            totalSessions: sessions.length,
            completedSessions: completedSessions.length,
            totalEffortTime: totalEffortTime
        });

        return {
            statusCode: 200,
            body: {
                message: 'SME efforts retrieved successfully',
                sme: {
                    id: sme.id,
                    email: sme.email,
                    name: sme.UserInformation?.name,
                    industry: sme.UserInformation?.industry,
                    profile_title: sme.UserInformation?.profile_title
                },
                effort_summary: {
                    total_sessions: sessions.length,
                    completed_sessions: completedSessions.length,
                    cancelled_sessions: sessions.filter(s => s.status === 'cancelled').length,
                    total_session_time_minutes: Math.round(totalSessionTime),
                    total_preparation_time_minutes: completedSessions.length * avgPreparationTime,
                    total_followup_time_minutes: completedSessions.length * avgFollowupTime,
                    total_effort_time_minutes: Math.round(totalEffortTime),
                    hourly_rate: hourlyRate,
                    total_payout: totalPayout
                },
                sessions: formattedSessions,
                period_days: days
            }
        };
    } catch (error) {
        logger.error(FILE_NAME, 'getSMEEfforts', requestId, {
            error,
            errorMessage: error.message,
            errorStack: error.stack,
            smeId: body.smeId
        });
        return {
            statusCode: 500,
            body: {
                message: 'Internal Server Error! Failed to retrieve SME efforts.',
            }
        };
    }
}