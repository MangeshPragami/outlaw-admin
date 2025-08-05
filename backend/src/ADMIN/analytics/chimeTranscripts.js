// backend/src/ADMIN/analytics/chimeTranscripts.js
import { config } from 'dotenv';
import { logger } from '../../logger/logger.js';
import { Booking, User, UserInformation } from '../../db/pool.js';
import { Op } from 'sequelize';

config();
const FILE_NAME = 'analytics/chimeTranscripts.js';

export async function chimeTranscripts(body) {
    const requestId = body.requestId;
    delete body.requestId;
    
    try {
        const { period = '30' } = body;
        const days = parseInt(period);
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        // Query 1: Transcript summary (matching your transcript coverage logic)
        const transcriptSummary = await Booking.findOne({
            where: {
                status: 'completed',
                start_time: { [Op.gte]: startDate }
            },
            attributes: [
                [Booking.sequelize.fn('COUNT', Booking.sequelize.literal("CASE WHEN transcript_url IS NOT NULL THEN 1 END")), 'sessions_with_transcripts'],
                [Booking.sequelize.fn('COUNT', Booking.sequelize.col('id')), 'total_completed_sessions'],
                [Booking.sequelize.literal('CAST((COUNT(CASE WHEN transcript_url IS NOT NULL THEN 1 END)::float / NULLIF(COUNT(*), 0) * 100) AS DECIMAL(5,2))'), 'transcript_coverage_rate']
            ],
            raw: true
        });

        // Query 2: Recent sessions with transcript status (matching your detailed session query)
        const recentSessions = await Booking.findAll({
            where: {
                start_time: { [Op.gte]: startDate }
            },
            include: [
                {
                    model: User,
                    as: 'Creator',
                    attributes: ['email'],
                    include: [{
                        model: UserInformation,
                        attributes: ['name'],
                        required: false
                    }]
                },
                {
                    model: User,
                    as: 'Participant',
                    attributes: ['email'],
                    include: [{
                        model: UserInformation,
                        attributes: ['name'],
                        required: false
                    }]
                }
            ],
            attributes: [
                'id',
                'virtual_conference_id',
                'start_time',
                'end_time',
                [Booking.sequelize.literal('EXTRACT(EPOCH FROM (end_time - start_time))/60'), 'duration_minutes'],
                'status',
                [Booking.sequelize.literal("CASE WHEN transcript_url IS NOT NULL THEN 'Available' ELSE 'Missing' END"), 'transcript_status'],
                [Booking.sequelize.literal("CASE WHEN video_recording_url IS NOT NULL THEN 'Available' ELSE 'Missing' END"), 'recording_status']
            ],
            order: [['start_time', 'DESC']],
            limit: 50,
            raw: true
        });

        // Query 3: Daily success rates (matching your daily breakdown logic)
        const dailySuccessRates = await Booking.findAll({
            where: {
                status: 'completed',
                start_time: { [Op.gte]: startDate }
            },
            attributes: [
                [Booking.sequelize.fn('DATE', Booking.sequelize.col('start_time')), 'session_date'],
                [Booking.sequelize.fn('COUNT', Booking.sequelize.col('id')), 'total_sessions'],
                [Booking.sequelize.fn('COUNT', Booking.sequelize.literal("CASE WHEN transcript_url IS NOT NULL THEN 1 END")), 'transcripts_generated'],
                [Booking.sequelize.fn('COUNT', Booking.sequelize.literal("CASE WHEN video_recording_url IS NOT NULL THEN 1 END")), 'recordings_available'],
                [Booking.sequelize.literal('CAST((COUNT(CASE WHEN transcript_url IS NOT NULL THEN 1 END)::float / NULLIF(COUNT(*), 0) * 100) AS DECIMAL(5,2))'), 'transcript_success_rate']
            ],
            group: [Booking.sequelize.fn('DATE', Booking.sequelize.col('start_time'))],
            order: [[Booking.sequelize.fn('DATE', Booking.sequelize.col('start_time')), 'DESC']],
            raw: true
        });

        return {
            statusCode: 200,
            body: {
                transcriptSummary: {
                    sessions_with_transcripts: parseInt(transcriptSummary.sessions_with_transcripts || 0),
                    total_completed_sessions: parseInt(transcriptSummary.total_completed_sessions || 0),
                    transcript_coverage_rate: parseFloat(transcriptSummary.transcript_coverage_rate || 0)
                },
                recentSessions: recentSessions.map(session => ({
                    booking_id: session.id,
                    virtual_conference_id: session.virtual_conference_id,
                    start_time: session.start_time,
                    end_time: session.end_time,
                    duration_minutes: parseFloat(session.duration_minutes || 0),
                    status: session.status,
                    transcript_status: session.transcript_status,
                    recording_status: session.recording_status,
                    creator_email: session['Creator.email'],
                    participant_email: session['Participant.email'],
                    creator_name: session['Creator.UserInformation.name'],
                    participant_name: session['Participant.UserInformation.name']
                })),
                dailySuccessRates: dailySuccessRates.map(item => ({
                    session_date: item.session_date,
                    total_sessions: parseInt(item.total_sessions),
                    transcripts_generated: parseInt(item.transcripts_generated),
                    recordings_available: parseInt(item.recordings_available),
                    transcript_success_rate: parseFloat(item.transcript_success_rate)
                })),
                message: 'Chime transcripts data retrieved successfully'
            }
        };
    } catch (error) {
        logger.error(FILE_NAME, 'chimeTranscripts', requestId, {
            error,
            errorMessage: error.message,
            errorStack: error.stack
        });
        return {
            statusCode: 500,
            body: {
                message: 'Internal Server Error! Failed to get Chime transcripts data.',
            }
        };
    }
}