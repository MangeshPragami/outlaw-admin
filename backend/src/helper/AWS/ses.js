import { config } from 'dotenv';
import { mailClient } from './aws-sdk.js';
import { logger } from '../../logger/logger.js';
import { EMAIL_USE_CASES } from '../constants.js';
import { SendEmailCommand } from '@aws-sdk/client-sesv2';

config();

const FILE_NAME = 'ses.js';

function createSendMailCommandPayload(toAddresses) {
    return {
        Destination: {
            ToAddresses: toAddresses,
        },
        Content: {
            Simple: {
                Body: {
                    Text: {
                        Charset: 'UTF-8',
                        Data: '',
                    },
                },
                Subject: {
                    Charset: 'UTF-8',
                    Data: '',
                }
            }
        },
        FromEmailAddress: process.env.OTP_VERIFICATION_FROM_EMAIL || "avichal@pragami.com"
    };
}

export async function sendEmail(toAddresses, useCase, data, requestId) {
    let sendEmailCommand = createSendMailCommandPayload(toAddresses);
    try {
        switch (useCase) {
            case EMAIL_USE_CASES.OTP_VERIFICATION: {
                sendEmailCommand.Content.Simple.Subject.Data = 'Outlaw Email Verification'
                sendEmailCommand.Content.Simple.Body.Text.Data = `Your OTP is ${data.otp}. It is valid for the next 15 minutes.`
                break;
            }
            case EMAIL_USE_CASES.FORGOT_PASSWORD: {
                sendEmailCommand.Content.Simple.Subject.Data = 'Forgot Password Link'
                sendEmailCommand.Content.Simple.Body.Text.Data = `Forgot Password Link ${data.link}. It is valid for the next 1 hour.`
                break;
            }
            default: {
                return;
            }
        }
        
        sendEmailCommand = new SendEmailCommand(sendEmailCommand);
        const sendMailRes = await mailClient.send(sendEmailCommand);
        console.log('sendMailRes: ', sendMailRes);

        return {
            error: false,
            data: sendMailRes
        }
    } catch (error) {
        logger.error(FILE_NAME, 'sendEmail', requestId, {
            error,
            errorMessage: error.message,
            errorStack: error.stack
        });
        return {
            error: true,
            errorData: {
                statusCode: 400,
                body: {
                    message: 'Internal Server Error! Email flows impacted.'
                }
            }
        }
    }
}
