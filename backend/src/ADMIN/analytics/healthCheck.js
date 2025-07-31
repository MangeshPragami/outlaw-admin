// analytics/healthCheck.js
import { config } from 'dotenv';
import { logger } from '../logger/logger.js';
import sequelize from '../db/pool.js';

config();
const FILE_NAME = 'analytics/healthCheck.js';

export async function healthCheck(body) {
    const requestId = body.requestId;
    delete body.requestId;
    
    try {
        // Test database connection
        await sequelize.authenticate();
        
        return {
            statusCode: 200,
            body: {
                status: 'OK',
                timestamp: new Date().toISOString(),
                database: 'Connected',
                message: 'Health check passed'
            }
        };
    } catch (error) {
        logger.error(FILE_NAME, 'healthCheck', requestId, {
            error,
            errorMessage: error.message,
            errorStack: error.stack
        });
        return {
            statusCode: 500,
            body: {
                status: 'ERROR',
                timestamp: new Date().toISOString(),
                database: 'Disconnected',
                message: 'Health check failed'
            }
        };
    }
}