import axios from 'axios';
import { config } from 'dotenv';
import { logger } from '../logger/logger.js';
import { getIdea, updateIdea } from './crud.js';
import { createIdeaAxiosInstance } from '../helper/axiosInstance.js';

config();

const FILE_NAME = 'regenerateIdea.js';
const AI_API_HOST = process.env.AI_S3_HOST;

export async function regenerateIdea(body) {
    const userId = body.userId;
    delete body.userId;

    const ideaId = body.ideaId

    const requestId = body.requestId;
    delete body.requestId;

    console.log('body', body)

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
            throw new Error('AI Request ID is missing!');
        }

        console.log('AI_API_HOST', AI_API_HOST)
        const aiJson = await axios.get(AI_API_HOST + `/Ideacaptureai/outputs/${latestIdea.ai_request_id}_step1.json`);
        const inputMetadata = aiJson?.data?.input_metadata;

        if (!inputMetadata) {
            throw new Error('AI input metadata is missing!');
        }

        const payload = {
            title: inputMetadata?.title,
            description: inputMetadata?.description,
            pitch_deck_file: inputMetadata?.pitch_deck_url,
            voice_note_file: inputMetadata?.voice_note_url,
            founder_goal: inputMetadata?.founder_goal,
        }
        
        const response = await createIdeaAxiosInstance.post('/analyze', payload);
        const aiData = response.data;

        if (!aiData?.request_id) {
            throw new Error('Request ID not present in /analyze API response!');
        }
        
        const updateIdeaResponse = await updateIdea(
            { user_id: userId, id: ideaId },
            { ai_request_id: aiData.request_id },
            requestId
        );

        if (updateIdeaResponse.error) {
            return updateIdeaResponse.errorData;
        }

        return {
            statusCode: 201,
            body: {
                message: 'Idea regenerated successfully!',
                data: aiData
            }
        };
    } catch (error) {
        logger.error(FILE_NAME, 'regenerateIdea', requestId, {
            error,
            errorMessage: error.message,
            errorStack: error.stack
        });

        return {
            statusCode: 500,
            body: { message: 'Internal Server Error! Could not regenerate idea.' }
        };
    }
}
