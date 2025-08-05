// admin/users/approveUser.js
import { config } from 'dotenv';
import { updateUser } from '../../user/crud.js';
import { logger } from '../../logger/logger.js';

config();
const FILE_NAME = 'admin/users/approveUser.js';

export async function adminApproveUser(body) {
    const userId = body.userId; // From URL parameter
    const requestId = body.requestId;
    delete body.requestId;
    delete body.userId;
    
    try {
        const { isApproved } = body;
        
        if (typeof isApproved !== 'boolean') {
            return {
                statusCode: 400,
                body: {
                    message: 'isApproved must be a boolean value.'
                }
            };
        }
        
        if (!userId) {
            return {
                statusCode: 400,
                body: {
                    message: 'User ID is required.'
                }
            };
        }

        const updateData = {
            email_verified_at: isApproved ? new Date() : null,
            consented_at: isApproved ? new Date() : null
        };

        const updateUserResponse = await updateUser(
            { id: userId, deleted_at: null },
            updateData,
            requestId
        );
        
        if (updateUserResponse.error) {
            return updateUserResponse.errorData;
        }

        return {
            statusCode: 200,
            body: {
                message: `User ${isApproved ? 'approved' : 'approval revoked'} successfully`,
                user: updateUserResponse.data.userResponse
            }
        };
    } catch (error) {
        logger.error(FILE_NAME, 'adminApproveUser', requestId, {
            error,
            errorMessage: error.message,
            errorStack: error.stack,
            userId
        });
        return {
            statusCode: 500,
            body: {
                message: 'Internal Server Error! Failed to update user approval.',
            }
        };
    }
}
