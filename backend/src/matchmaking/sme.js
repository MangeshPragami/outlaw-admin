import { Op } from 'sequelize';
import { config } from 'dotenv';
import { getIdea } from '../idea/crud.js';
import { getUsers } from '../user/crud.js';
import { logger } from '../logger/logger.js';
import { UserInformation } from '../db/pool.js';
import { USER_ROLES } from '../helper/constants.js';
import { readDataFromAIS3, readDataFromS3 } from '../helper/AWS/s3.js';
import { parseStringifiedBody } from '../helper/helper.js';
import { smeMatchmakingValidation } from "../joi/validation.js";
import { matchmakingAxiosInstance } from "../helper/axiosInstance.js";
config();

const FILE_NAME = 'sme.js';

export async function smeMatchmakingAPI(body) {
    const userId = body.userId;
    delete body.userId;

    const requestId = body.requestId;
    delete body.requestId;

    try {
        const { headerError, bodyError } = smeMatchmakingValidation(body);

        if (headerError || bodyError) {
            return {
                statusCode: 400,
                body: {
                    message: 'Oops! Something went wrong.',
                    error: 'Invalid payload ' + (headerError || bodyError.details.map(d => d.message).join('; '))
                }
            };
        }

        const ideaDataFromDB = await getIdea(
            {
                id: body.ideaId,
                user_id: userId
            },
            null,
            null,
            null,
            requestId
        )

        if (ideaDataFromDB.error) {
            return ideaDataFromDB.errorData;
        }

        const idea = ideaDataFromDB.data.idea;

        const response = await readDataFromS3(idea.idea_capture.split('/').slice(3).join('/'), requestId); 
        if (response.error) {
            return response.errorData;
        } 

        const ideaCaptureDataFromS3 = parseStringifiedBody(response.data.stringifiedResponse);

        const bodyData = {
            request_id: idea.ai_request_id,
            title: ideaCaptureDataFromS3.input_metadata.title || '',
            description: ideaCaptureDataFromS3.input_metadata.description || '',
            audience: ideaCaptureDataFromS3.input_metadata.audience || [],
            problemStatements: ideaCaptureDataFromS3.input_metadata.problemStatements || [],
            tags: ideaCaptureDataFromS3.input_metadata.tags,
            burningProblems: ideaCaptureDataFromS3.userChallenges || ideaCaptureDataFromS3.finalize.burningProblems || [],
        };

        const ideaCaptureFromAI = await matchmakingAxiosInstance.post("/sme/match", bodyData);
        const aiData = ideaCaptureFromAI.data;
        console.log('aiData', aiData)

        const userDataFromS3 = await readDataFromAIS3(process.env.AI_SME_MATCHAMKER_S3_BUCKET_NAME, aiData.match_file.split('/').slice(3).join('/'), requestId);
        if (response.error) {
            return response.errorData;
        } 
        
        const parsedUserDataFromS3 = parseStringifiedBody(userDataFromS3.data.stringifiedResponse);
        const userIds = parsedUserDataFromS3.matches.map(userData => userData.user_id) || [];
        const queryObj = {
            persona_type: USER_ROLES.SME,
            id: {
                [Op.in]: userIds
            }
        }

        const includesStatementObj = {
            model: UserInformation,
            as: 'user_information',
        };
        
        const userDataFromDB = await getUsers(
            queryObj,
            [includesStatementObj],
            ['id'],
            requestId
        );

        if (userDataFromDB.error) {
            return userDataFromDB.errorData;
        }

        const userData = userDataFromDB.data.users;

        return {
            statusCode: 201,
            body: {
                message: 'SME Data found',
                users: userData
            }
        };

    } catch (error) {
        logger.error(FILE_NAME, 'smeMatchmakingAPI', requestId, {
            error,
            errorMessage: error.message,
            errorStack: error.stack
        });
        return {
            statusCode: 500,
            body: {
                message: 'Internal Server Error! Failed to fetch users.',
            }
        };
    }
}
