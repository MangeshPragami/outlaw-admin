// backend/src/ADMIN/sme/approveSMEApplication.js
import { config } from 'dotenv';
import { logger } from '../../logger/logger.js';
import { User } from '../../db/pool.js';

config();
const FILE_NAME = 'ADMIN/sme/approveSMEApplication.js';

export async function approveSMEApplication(body) {
    const requestId = body.requestId;
    delete body.requestId;
    
    try {
        const { 
            smeId, 
            expertise_areas = [], 
            hourly_rate = 150, 
            admin_notes = '',
            availability_status = 'available'
        } = body;

        if (!smeId) {
            return {
                statusCode: 400,
                body: {
                    message: 'SME ID is required',
                }
            };
        }

        // Check if SME exists and is not already approved
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

        if (sme.verified_by_admin === true) {
            return {
                statusCode: 409,
                body: {
                    message: 'SME is already approved',
                }
            };
        }

        // Update user verification status
        const updatedSME = await sme.update({
            verified_by_admin: true,
            updated_at: new Date()
        });

        // Create or update SME data (you might need to create a separate SME_Data table)
        // For now, we'll store this in a JSON field or separate logic
        const smeData = {
            expertise_areas,
            hourly_rate,
            admin_notes,
            availability_status,
            approved_at: new Date().toISOString(),
            status: 'active'
        };

        logger.info(FILE_NAME, 'approveSMEApplication', requestId, {
            message: 'SME application approved successfully',
            smeId: smeId,
            email: sme.email,
            expertise_areas,
            hourly_rate
        });

        return {
            statusCode: 200,
            body: {
                message: 'SME application approved successfully',
                sme: {
                    id: updatedSME.id,
                    email: updatedSME.email,
                    verified_by_admin: updatedSME.verified_by_admin,
                    updated_at: updatedSME.updated_at,
                    sme_data: smeData
                }
            }
        };
    } catch (error) {
        logger.error(FILE_NAME, 'approveSMEApplication', requestId, {
            error,
            errorMessage: error.message,
            errorStack: error.stack,
            smeId: body.smeId
        });
        return {
            statusCode: 500,
            body: {
                message: 'Internal Server Error! Failed to approve SME application.',
            }
        };
    }
}