// backend/src/ADMIN/analytics/bookingsOverview.js
import { config } from 'dotenv';
import { logger } from '../../logger/logger.js';
import { Booking } from '../../db/pool.js';
import { Op } from 'sequelize';

config();
const FILE_NAME = 'analytics/bookingsOverview.js';

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

export async function bookingsOverview(body) {
    const requestId = body.requestId;
    delete body.requestId;
    
    try {
        const { period = 'all' } = body;
        const dateFilter = getDateFilter(period);
        
        const whereClause = {};
        if (dateFilter) {
            whereClause.start_time = dateFilter;
        }

        // Query 1: Booking stats (matching your status breakdown logic)
        const bookingStats = await Booking.findOne({
            where: whereClause,
            attributes: [
                [Booking.sequelize.fn('COUNT', Booking.sequelize.col('id')), 'total_bookings'],
                [Booking.sequelize.fn('COUNT', Booking.sequelize.literal("CASE WHEN status = 'confirmed' THEN 1 END")), 'confirmed'],
                [Booking.sequelize.fn('COUNT', Booking.sequelize.literal("CASE WHEN status = 'completed' THEN 1 END")), 'completed'],
                [Booking.sequelize.fn('COUNT', Booking.sequelize.literal("CASE WHEN status = 'cancelled' THEN 1 END")), 'cancelled']
            ],
            raw: true
        });

        // Query 2: Average session duration (matching your duration logic)
        const durationStats = await Booking.findOne({
            where: {
                ...whereClause,
                end_time: { [Op.not]: null },
                start_time: { [Op.not]: null }
            },
            attributes: [
                [Booking.sequelize.fn('AVG', Booking.sequelize.literal("EXTRACT(EPOCH FROM (end_time - start_time))/60")), 'avg_duration_minutes'],
                [Booking.sequelize.fn('COUNT', Booking.sequelize.col('id')), 'completed_sessions']
            ],
            raw: true
        });

        return {
            statusCode: 200,
            body: {
                overview: {
                    total_bookings: parseInt(bookingStats.total_bookings || 0),
                    confirmed: parseInt(bookingStats.confirmed || 0),
                    completed: parseInt(bookingStats.completed || 0),
                    cancelled: parseInt(bookingStats.cancelled || 0)
                },
                duration: {
                    avg_duration_minutes: parseFloat(durationStats.avg_duration_minutes || 0),
                    completed_sessions: parseInt(durationStats.completed_sessions || 0)
                },
                message: 'Bookings overview retrieved successfully'
            }
        };
    } catch (error) {
        logger.error(FILE_NAME, 'bookingsOverview', requestId, {
            error,
            errorMessage: error.message,
            errorStack: error.stack
        });
        return {
            statusCode: 500,
            body: {
                message: 'Internal Server Error! Failed to get bookings overview.',
            }
        };
    }
}