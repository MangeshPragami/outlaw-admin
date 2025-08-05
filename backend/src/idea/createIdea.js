import { config } from 'dotenv';
import { createIdea } from './crud.js';
import { logger } from '../logger/logger.js';
import { createIdeaValidation } from "../joi/validation.js";
import { createIdeaAxiosInstance } from "../helper/axiosInstance.js";
config();

const FILE_NAME = 'createIdea.js';


export async function createIdeaAPI(body) {
    const userId = body.userId;
    delete body.userId;

    const requestId = body.requestId;
    delete body.requestId;

    try {
        const { headerError, bodyError } = createIdeaValidation(body);

        if (headerError || bodyError) {
            return {
                statusCode: 400,
                body: {
                    message: 'Oops! Something went wrong.',
                    error: 'Invalid payload ' + (headerError || bodyError.details.map(d => d.message).join('; '))
                }
            };
        }

        const {
            name,
            description,
            targeted_audience,
            stage,
            pitch_deck_file,
            voice_note_file,
            document_file
        } = body;


        const bodyData = {
            title: name,
            description,
            founder_goal: "Validate product-market fit",
            pitch_deck_file: pitch_deck_file,
            voice_note_file,
            document: document_file,
        };

        const ideaCaptureFromAI = await createIdeaAxiosInstance.post("/analyze", bodyData);
        const aiData = ideaCaptureFromAI.data;

        const createIdeaResponse = await createIdea(
            {
                user_id: userId,
                name,
                description,
                targeted_audience,
                pitch_deck: pitch_deck_file,
                voice_note: voice_note_file,
                stage,
                ai_request_id: aiData?.request_id,
                document: document_file,
            },
            requestId
        )

        if (createIdeaResponse.error) {
            return createIdeaResponse.errorData;
        }

        return {
            statusCode: 201,
            body: {
                message: 'Idea created successfully',
                data: aiData,
                ideaId: createIdeaResponse?.data?.idea?.id
            }
        };

    } catch (error) {
        logger.error(FILE_NAME, 'createIdeaAPI', requestId, {
            error,
            errorMessage: error.message,
            errorStack: error.stack
        });
        return {
            statusCode: 500,
            body: {
                message: 'Internal Server Error! Failed to create the idea.',
            }
        };
    }
}
