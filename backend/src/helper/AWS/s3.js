import { config } from 'dotenv';
import { s3Client } from "./aws-sdk.js";
import { logger } from '../../logger/logger.js';
import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
config();

const FILE_NAME = 's3.js';
const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME;
const AWS_REGION = process.env.AWS_REGION;

export const uploadDataToS3 = async (filePath, data, requestId) => {
    try {

        if (!S3_BUCKET_NAME) {
            throw new Error('S3 Bucket Name not defined');
        }
        
        const uploadParams = {
            Bucket: S3_BUCKET_NAME,
            Key: filePath,
            Body: data,
            ContentType: 'application/json',
            ACL: 'public-read',
        };
    
        const result = await s3Client.send(new PutObjectCommand(uploadParams));
        
        const host = `https://${S3_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${filePath}`;
        
        return {
            error: false,
            data: {
                location: host
            }
        }
    } catch (error) {
        logger.error(FILE_NAME, 'uploadDataToS3', requestId, {
            error,
            errorMessage: error.message,
            errorStack: error.stack
        });
        return {
            error: true,
            errorData: {
                statusCode: 424,
                body: {
                    message: 'Internal Server Error! S3 flows impacted.'
                }
            }
        }
    }
};

export const readDataFromS3 = async(filePath, requestId) => {
        try {

        if (!S3_BUCKET_NAME) {
            throw new Error('S3 Bucket Name not defined');
        }
        
        const uploadParams = {
            Bucket: S3_BUCKET_NAME,
            Key: filePath
        };
        
        const response = await s3Client.send(new GetObjectCommand(uploadParams));
        
        const stringifiedResponse = await response.Body.transformToString();
        
        return {
            error: false,
            data: {
                stringifiedResponse
            }
        }
    } catch (error) {
        logger.error(FILE_NAME, 'readDataFromS3', requestId, {
            error,
            errorMessage: error.message,
            errorStack: error.stack
        });
        return {
            error: true,
            errorData: {
                statusCode: 424,
                body: {
                    message: 'Internal Server Error! S3 flows impacted.'
                }
            }
        }
    }
}

export const readDataFromAIS3 = async(bucketName, filePath, requestId) => {
        try {

        if (!bucketName) {
            throw new Error('S3 Bucket Name not defined');
        }
        
        const uploadParams = {
            Bucket: bucketName,
            Key: filePath
        };
        
        const response = await s3Client.send(new GetObjectCommand(uploadParams));
        
        const stringifiedResponse = await response.Body.transformToString();
        
        return {
            error: false,
            data: {
                stringifiedResponse
            }
        }
    } catch (error) {
        logger.error(FILE_NAME, 'readDataFromAIS3', requestId, {
            error,
            errorMessage: error.message,
            errorStack: error.stack
        });
        return {
            error: true,
            errorData: {
                statusCode: 424,
                body: {
                    message: 'Internal Server Error! S3 flows impacted.'
                }
            }
        }
    }
}