// admin/users/deleteUser.js
import { config } from 'dotenv';
import { updateUser } from '../../user/crud.js';
import { logger } from '../../logger/logger.js';

config();
const FILE_NAME = 'admin/users/deleteUser.js';

export async function adminDeleteUser(body) {
    const userId = body.userId; // From URL parameter
    const requestId = body.requestId;
    delete body.requestId;
    delete body.userId;
    
    try {
        if (!userId) {
            return {
                statusCode: 400,
                body: {
                    message: 'User ID is required.'
                }
            };
        }

        // Soft delete by setting deleted_at timestamp
        const updateData = {
            deleted_at: new Date()
        };

        const deleteUserResponse = await updateUser(
            { id: userId, deleted_at: null }, // Only delete if not already deleted
            updateData,
            requestId
        );
        
        if (deleteUserResponse.error) {
            return deleteUserResponse.errorData;
        }

        return {
            statusCode: 200,
            body: {
                message: 'User deleted successfully',
                deleted_user_id: userId
            }
        };
    } catch (error) {
        logger.error(FILE_NAME, 'adminDeleteUser', requestId, {
            error,
            errorMessage: error.message,
            errorStack: error.stack,
            userId
        });
        return {
            statusCode: 500,
            body: {
                message: 'Internal Server Error! Failed to delete user.',
            }
        };
    }
}