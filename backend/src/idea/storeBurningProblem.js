import { config } from 'dotenv';
import { getIdea } from "./crud.js";
import { logger } from '../logger/logger.js';
import { parseStringifiedBody } from "../helper/helper.js";
import { readDataFromS3, uploadDataToS3 } from '../helper/AWS/s3.js';
config();

const FILE_NAME = 'storeBurningProblem.js';

export async function storeBurningProblem(body) {
    const userId = body.userId;
    delete body.userId;

    const requestId = body.requestId;
    delete body.requestId;

    const ideaId = body.ideaId;

    try {
        const ideaDataFromDB = await getIdea(
            { user_id: userId, id: ideaId },
            null,
            null,
            [['created_at', 'DESC']],
            requestId
        );

        if(ideaDataFromDB.error) {
            return ideaDataFromDB.errorData
        }

        const idea = ideaDataFromDB.data.idea;
        
        const response = await readDataFromS3(idea.idea_capture.split('/').slice(3).join('/'), requestId); 
        if (response.error) {
            return response.errorData;
        }       
                
        const aiRequestId = idea.ai_request_id;        
        const key = `users/${userId}/idea-capture/${aiRequestId}.json`;
        
        const burningData = { ...parseStringifiedBody(response.data.stringifiedResponse), userChallenges: body.userChallenges || [] };
        const jsonBody = JSON.stringify(burningData, null, 2);
        const uploadResponse = await uploadDataToS3(key, jsonBody, requestId);

        if (uploadResponse.error) {
            return uploadResponse.errorData;
        }

        return {
            statusCode: 201,
            body: {
                message: 'Burning problem added successfully.'
            }
        };

    } catch (error) {
        logger.error(FILE_NAME, 'storeBurningProblem', requestId, {
            error,
            errorMessage: error.message,
            errorStack: error.stack
        });
        return {
            statusCode: 500,
            body: {
                message: 'Internal Server Error! Failed to store burning problem.',
            }
        };
    }
}
