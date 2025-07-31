import axios from 'axios';
import { config } from 'dotenv';
import { getIdea } from './crud.js';
import { logger } from '../logger/logger.js';

config();

const FILE_NAME = 'getLatestIdea.js';
const AI_S3_HOST = process.env.AI_S3_HOST;

export async function getLatestIdea(body) {
    const { userId, requestId, ideaId } = body;

    try {

        const ideaFromDB = await getIdea(
            { user_id: userId, id: ideaId },
            null,
            null,
            [['created_at', 'DESC']],
            requestId
        )

        if (ideaFromDB.error) {
            return ideaFromDB.errorData;
        }

        const latestIdea = ideaFromDB.data.idea;

        if (!latestIdea.ai_request_id) {
            return {
                statusCode: 200,
                body: {
                    message: 'Latest idea fetched successfully.',
                    data: {},
                }
            };
        }
        
        let ideaCaptureAnalyze = null
        if (latestIdea.idea_capture) {
            const latestIdeaCaptureResponse = await axios.get(latestIdea.idea_capture);
            ideaCaptureAnalyze = latestIdeaCaptureResponse.data?.input_metadata || null;
        }

        // https://outlawml-testing.s3.ap-south-1.amazonaws.com/Ideacaptureai/outputs/${requestId}_step1.json
        // Make API call to S3
        const response = await axios.get(AI_S3_HOST + `/Ideacaptureai/outputs/${latestIdea.ai_request_id}_step1.json`);

        console.log('response', response)
        const aiResponse = {
            ...response.data, 
            message: 'SUCCESS', 
            stage: latestIdea.stage,
            analyze: ideaCaptureAnalyze ? ideaCaptureAnalyze : response.data.analyze
        };

        return {
            statusCode: 200,
            body: {
                message: 'Latest idea fetched successfully.',
                data: aiResponse,
            }
        };

    } catch (error) {
        logger.error(FILE_NAME, 'getLatestIdea', requestId, {
            error,
            errorMessage: error.message,
            errorStack: error.stack
        });

        return {
            statusCode: 500,
            body: {
                message: 'Internal Server Error while fetching latest idea.'
            }
        };
    }
}
