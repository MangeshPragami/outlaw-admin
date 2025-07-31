import {logger} from "../logger/logger.js";
import {uploadDataToS3} from "../helper/AWS/s3.js";
import {Form, FormResponses} from "../db/pool.js";
import {DynamoDBClient, PutItemCommand} from "@aws-sdk/client-dynamodb";

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });

const FILE_NAME = 'form_responses/create.js';

export async function createResponse(body) {

    const userId = body.userId;
    delete body.userId;

    const requestId = body.requestId;
    delete body.requestId;

    const { formId } = body

    try {
        const form = await Form.findByPk(formId, { include: [{ association: 'idea', attributes: ['ai_request_id'] }] });

        if (!form) {
            return {
                statusCode: 404,
                body: {
                    message: 'Form not found.',
                }
            }
        }

        const now = new Date(new Date().toUTCString()).getTime();
        const formEndsAt = new Date(form.end_time).getTime();
        const formStartsAt = new Date(form.start_time).getTime();

        if (formStartsAt > now || formEndsAt < now) {
            return {
                statusCode: 409,
                body: {
                    message: 'Form is no longer accepting responses!'
                }
            }
        }

        const existingResponse = await FormResponses.findOne({
            where: {
                form_id: formId,
                responder_id: userId
            }
        });
        if (existingResponse) {
            return {
                statusCode: 400,
                body: {
                    message: 'You have already submitted this form.'
                }
            };
        }

        const plainBody = {respondent_id: userId, responses: body.questions, request_id: form.idea.ai_request_id };
        const jsonBody = JSON.stringify(plainBody);

        // Generate ai_response_id
        const ai_response_id = `airid_${form.idea.ai_request_id}`;
        const idea_id = form.idea_id;

        // Prepare the item for DynamoDB
        const item = {
            ai_response_id: { S: ai_response_id }, // PK
            composite: { S: `FORM${formId.toString()}#RESPONDENTID${userId.toString()}` },    // SK
            idea_id: { S: idea_id.toString() },
            form_id: { S: formId.toString() },
            form_response: { S: jsonBody }
        };

        // Write to DynamoDB
        await dynamoClient.send(new PutItemCommand({
            TableName: "form_responses", // Make sure this matches your DynamoDB table name
            Item: item
        }));

        const key = `users/${userId}/idea-capture/${form.idea_id}/survey/${formId}.json`;
        console.log('key', key)

        const uploadResponse = await uploadDataToS3(key, jsonBody, requestId);

        if (uploadResponse.error) {
            return uploadResponse.errorData;
        }

        console.log({
            form_id: formId,
            responder_id: userId,
            form_response_url: uploadResponse.data.location
        })

        await FormResponses.create({
            form_id: formId,
            responder_id: userId,
            form_response_url: uploadResponse.data.location
        });

        return {
            statusCode: 201,
            body: {
                message: 'Survey submitted successfully.',
                ai_request_id: form.idea ? form.idea.ai_request_id : null
            }
        };

    } catch (error) {
        logger.error(FILE_NAME, 'createFormResponseAPI', requestId, {
            error,
            errorMessage: error.message,
            errorStack: error.stack
        });
        return {
            statusCode: 500,
            body: {
                message: 'Could not create form response'
            }
        }
    }
}
