// backend/src/ADMIN/analytics/chimeOverview.js
import { config } from 'dotenv';
import { logger } from '../../logger/logger.js';
import { Booking } from '../../db/pool.js';
import { Op } from 'sequelize';

config();
const FILE_NAME = 'analytics/chimeOverview.js';

function getDateFilter(period) {
    const now = new Date();
    switch (period) {
        case 'week':
            return { [Op.gte]: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) };
        case 'month':
            return { [Op.gte]: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) };
        case 'quarter':
            return { [Op.gte]: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000) };
        default:
            return null;
    }
}

export async function chimeOverview(body) {
    const requestId = body.requestId;
    delete body.requestId;
    
    try {
        const { period = 'all' } = body;
        const dateFilter = getDateFilter(period);
        
        const whereClause = {};
        if (dateFilter) {
            whereClause.start_time = dateFilter;
        }

        // Query 1: Session overview (matching your Chime session logic)
        const sessionOverview = await Booking.findOne({
            where: whereClause,
            attributes: [
                [Booking.sequelize.fn('COUNT', Booking.sequelize.col('id')), 'total_sessions'],
                [Booking.sequelize.fn('COUNT', Booking.sequelize.literal("CASE WHEN status = 'completed' THEN 1 END")), 'completed_sessions'],
                [Booking.sequelize.fn('COUNT', Booking.sequelize.literal("CASE WHEN transcript_url IS NOT NULL THEN 1 END")), 'sessions_with_transcripts'],
                [Booking.sequelize.fn('COUNT', Booking.sequelize.literal("CASE WHEN video_recording_url IS NOT NULL THEN 1 END")), 'sessions_with_recordings'],
                [Booking.sequelize.fn('COUNT', Booking.sequelize.literal("CASE WHEN virtual_conference_id IS NOT NULL THEN 1 END")), 'chime_sessions'],
                [Booking.sequelize.literal('CAST((COUNT(CASE WHEN status = \'completed\' THEN 1 END)::float / NULLIF(COUNT(*), 0) * 100) AS DECIMAL(5,2))'), 'completion_rate']
            ],
            raw: true
        });

        // Query 2: Session duration analytics (matching your duration analytics)
        const durationStats = await Booking.findOne({
            where: {
                ...whereClause,
                end_time: { [Op.not]: null },
                start_time: { [Op.not]: null }
            },
            attributes: [
                [Booking.sequelize.fn('AVG', Booking.sequelize.literal("EXTRACT(EPOCH FROM (end_time - start_time))/60")), 'avg_duration_minutes'],
                [Booking.sequelize.fn('MIN', Booking.sequelize.literal("EXTRACT(EPOCH FROM (end_time - start_time))/60")), 'min_duration_minutes'],
                [Booking.sequelize.fn('MAX', Booking.sequelize.literal("EXTRACT(EPOCH FROM (end_time - start_time))/60")), 'max_duration_minutes'],
                [Booking.sequelize.literal('PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (end_time - start_time))/60)'), 'median_duration_minutes'],
                [Booking.sequelize.fn('COUNT', Booking.sequelize.col('id')), 'sessions_with_duration']
            ],
            raw: true
        });

        return {
            statusCode: 200,
            body: {
                sessionOverview: {
                    total_sessions: parseInt(sessionOverview.total_sessions || 0),
                    completed_sessions: parseInt(sessionOverview.completed_sessions || 0),
                    sessions_with_transcripts: parseInt(sessionOverview.sessions_with_transcripts || 0),
                    sessions_with_recordings: parseInt(sessionOverview.sessions_with_recordings || 0),
                    chime_sessions: parseInt(sessionOverview.chime_sessions || 0),
                    completion_rate: parseFloat(sessionOverview.completion_rate || 0)
                },
                durationStats: {
                    avg_duration_minutes: parseFloat(durationStats.avg_duration_minutes || 0),
                    min_duration_minutes: parseFloat(durationStats.min_duration_minutes || 0),
                    max_duration_minutes: parseFloat(durationStats.max_duration_minutes || 0),
                    median_duration_minutes: parseFloat(durationStats.median_duration_minutes || 0),
                    sessions_with_duration: parseInt(durationStats.sessions_with_duration || 0)
                },
                message: 'Chime overview retrieved successfully'
            }
        };
    } catch (error) {
        logger.error(FILE_NAME, 'chimeOverview', requestId, {
            error,
            errorMessage: error.message,
            errorStack: error.stack
        });
        return {
            statusCode: 500,
            body: {
                message: 'Internal Server Error! Failed to get Chime overview.',
            }
        };
    }
}
