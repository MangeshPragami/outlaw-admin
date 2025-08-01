import { app } from './server.js';
import { randomUUID } from 'crypto';

// Main Lambda handler function
export const handler = async (event, context) => {
    // Ensure we have a request ID for tracing
    const requestId = context.awsRequestId || randomUUID();
    
    console.log('Lambda Event:', {
        httpMethod: event.httpMethod,
        path: event.path,
        rawPath: event.rawPath,
        requestId,
        headers: event.headers
    });

    try {
        // Your existing app function expects event, context, requestId
        const result = await app(event, context, requestId);
        
        // Ensure the response follows Lambda proxy integration format
        return {
            statusCode: result.statusCode || 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
                'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
                ...(result.headers || {})
            },
            body: typeof result.body === 'string' ? result.body : JSON.stringify(result.body)
        };
    } catch (error) {
        console.error('Lambda Handler Error:', {
            error: error.message,
            stack: error.stack,
            requestId
        });
        
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                error: 'Internal server error',
                requestId,
                message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
            })
        };
    }
};