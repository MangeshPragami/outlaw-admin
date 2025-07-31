import { config } from 'dotenv';
import {Form, Idea} from '../db/pool.js';
import { logger } from '../logger/logger.js';
import axios from 'axios';
import { surveyGeneratorAxiosInstance } from "../helper/axiosInstance.js";
import { uploadDataToS3 } from "../helper/AWS/s3.js";

config();

const FILE_NAME = 'ideaSurveyGenerator.js';

export async function ideaSurveyGenerator(event) {
    const { userId, requestId, ideaId } = event;

    if (!userId) {
        return {
            statusCode: 400,
            body: { message: 'User ID is required.' }
        };
    }

    try {
        const idea = await Idea.findOne({
            where: ideaId ? { id: ideaId, user_id: userId } : { user_id: userId },
            order: ideaId ? undefined : [['created_at', 'DESC']]
        });

        if (!idea) {
            return {
                statusCode: 404,
                body: { message: 'No idea found.' }
            };
        }

        // If survey_generator exists, fetch from S3 and return
        if (idea.survey_generator) {
            try {
                const { data: existingSurveyData } = await axios.get(idea.survey_generator);

                const formData = await Form.findOne({
                    where: {
                        idea_id: idea.id
                    },
                    order: [['created_at', 'DESC']]
                })


                if(formData) {
                    const { data } = await axios.get(formData.form_url);

                    return {
                        statusCode: 200,
                        body: {
                            message: 'Survey already generated.',
                            data: data?.questions,
                            isNew: false,
                            formId: formData.id,
                        }
                    };
                }

                return {
                    statusCode: 200,
                    body: {
                        message: 'Survey already generated.',
                        data: existingSurveyData?.questions,
                        isNew: true
                    }
                };

            } catch (fetchError) {
                logger.error(FILE_NAME, 'fetchExistingSurveyData', requestId, {
                    error: fetchError,
                    errorMessage: fetchError.message
                });
                return {
                    statusCode: 500,
                    body: { message: 'Failed to fetch existing survey data from S3.' }
                };
            }
        }

        if (!idea.idea_capture) {
            return {
                statusCode: 400,
                body: { message: 'Missing idea_capture data for this idea.' }
            };
        }

        // Download idea capture from S3
        const { data: ideaCaptureData } = await axios.get(idea.idea_capture);

        const aiPayload = {
            title: ideaCaptureData?.input_metadata?.title,
            description: ideaCaptureData?.input_metadata?.description,
            stage: idea.stage,
            burningProblems: ideaCaptureData?.finalize?.burningProblems,
            surveyPurpose: "Validate need for daily, accessible parenting support and identify top stressors for modern parents"
        };

        // Generate survey via AI
        const surveyGeneratorResponse = await surveyGeneratorAxiosInstance.post('/survey-generator', aiPayload);
        const surveyData = surveyGeneratorResponse?.data;

        if (!surveyData || surveyData.error) {
            return {
                statusCode: 500,
                body: { message: 'Survey generation failed.', error: surveyData?.error }
            };
        }

        // Upload survey result to S3
        const key = `users/${userId}/survey-generator/${idea.ai_request_id}.json`;
        const jsonBody = JSON.stringify(surveyData, null, 2);
        const uploadResponse = await uploadDataToS3(key, jsonBody, requestId);

        if (uploadResponse.error) {
            return uploadResponse.errorData;
        }

        // Save the S3 URL in DB
        idea.survey_generator = uploadResponse.data.location;
        await idea.save();

        const questions = surveyData?.questions;
        return {
            statusCode: 200,
            body: {
                message: 'Survey generated and stored successfully.',
                data: questions,
                isNew: true
            }
        };

    } catch (error) {
        logger.error(FILE_NAME, 'ideaSurveyGenerator', requestId, {
            error,
            errorMessage: error.message,
            errorStack: error.stack
        });

        return {
            statusCode: 500,
            body: {
                message: 'Internal Server Error.',
                error: error.message
            }
        };
    }
}
