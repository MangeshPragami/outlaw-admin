// backend/src/ADMIN/sme/rejectSMEApplication.js
import { config } from 'dotenv';
import { logger } from '../../logger/logger.js';
import { User } from '../../db/pool.js';

config();
const FILE_NAME = 'ADMIN/sme/rejectSMEApplication.js';

export async function rejectSMEApplication(body) {
    const requestId = body.requestId;
    delete body.requestId;
    
    try {
        const { 
            smeId, 
            rejection_reason = '', 
            admin_notes = ''
        } = body;

        if (!smeId) {
            return {
                statusCode: 400,
                body: {
                    message: 'SME ID is required',
                }
            };
        }

        if (!rejection_reason.trim()) {
            return {
                statusCode: 400,
                body: {
                    message: 'Rejection reason is required',
                }
            };
        }

        // Check if SME exists
        const sme = await User.findOne({
            where: {
                id: smeId,
                persona_type: 'sme',
                deleted_at: null
            }
        });

        if (!sme) {
            return {
                statusCode: 404,
                body: {
                    message: 'SME not found or not a valid SME application',
                }
            };
        }

        if (sme.verified_by_admin === false) {
            return {
                statusCode: 409,
                body: {
                    message: 'SME is already rejected',
                }
            };
        }

        // Update user verification status to rejected
        const updatedSME = await sme.update({
            verified_by_admin: false,
            updated_at: new Date()
        });

        // Store rejection data
        const rejectionData = {
            rejection_reason,
            admin_notes,
            rejected_at: new Date().toISOString(),
            status: 'rejected'
        };

        logger.info(FILE_NAME, 'rejectSMEApplication', requestId, {
            message: 'SME application rejected',
            smeId: smeId,
            email: sme.email,
            rejection_reason
        });

        return {
            statusCode: 200,
            body: {
                message: 'SME application rejected successfully',
                sme: {
                    id: updatedSME.id,
                    email: updatedSME.email,
                    verified_by_admin: updatedSME.verified_by_admin,
                    updated_at: updatedSME.updated_at,
                    rejection_data: rejectionData
                }
            }
        };
    } catch (error) {
        logger.error(FILE_NAME, 'rejectSMEApplication', requestId, {
            error,
            errorMessage: error.message,
            errorStack: error.stack,
            smeId: body.smeId
        });
        return {
            statusCode: 500,
            body: {
                message: 'Internal Server Error! Failed to reject SME application.',
            }
        };
    }
}