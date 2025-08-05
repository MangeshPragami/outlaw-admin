// backend/src/ADMIN/sme/updateSMEProfile.js
import { config } from 'dotenv';
import { logger } from '../../logger/logger.js';
import { User, UserInformation } from '../../db/pool.js';

config();
const FILE_NAME = 'ADMIN/sme/updateSMEProfile.js';

export async function updateSMEProfile(body) {
    const requestId = body.requestId;
    delete body.requestId;
    
    try {
        const { 
            smeId,
            expertise_areas = [],
            specializations = [],
            hourly_rate,
            availability_status = 'available',
            admin_notes = '',
            status = 'active'
        } = body;

        if (!smeId) {
            return {
                statusCode: 400,
                body: {
                    message: 'SME ID is required',
                }
            };
        }

        // Check if SME exists and is approved
        const sme = await User.findOne({
            where: {
                id: smeId,
                persona_type: 'sme',
                verified_by_admin: true,
                deleted_at: null
            },
            include: [{
                model: UserInformation,
                required: false
            }]
        });

        if (!sme) {
            return {
                statusCode: 404,
                body: {
                    message: 'SME not found or not approved',
                }
            };
        }

        // Update user information if provided
        let updatedProfile = null;
        if (sme.UserInformation) {
            // Update existing profile
            updatedProfile = await sme.UserInformation.update({
                updated_at: new Date()
            });
        }

        // Store SME-specific data (you might want to create a separate SME table)
        const smeData = {
            expertise_areas: Array.isArray(expertise_areas) ? expertise_areas : [],
            specializations: Array.isArray(specializations) ? specializations : [],
            hourly_rate: hourly_rate ? parseFloat(hourly_rate) : 150,
            availability_status,
            admin_notes,
            status,
            updated_at: new Date().toISOString()
        };

        // Update the user record with updated timestamp
        const updatedSME = await sme.update({
            updated_at: new Date()
        });

        logger.info(FILE_NAME, 'updateSMEProfile', requestId, {
            message: 'SME profile updated successfully',
            smeId: smeId,
            email: sme.email,
            expertise_areas,
            hourly_rate: smeData.hourly_rate,
            status
        });

        return {
            statusCode: 200,
            body: {
                message: 'SME profile updated successfully',
                sme: {
                    id: updatedSME.id,
                    email: updatedSME.email,
                    name: sme.UserInformation?.name,
                    verified_by_admin: updatedSME.verified_by_admin,
                    updated_at: updatedSME.updated_at,
                    sme_data: smeData
                }
            }
        };
    } catch (error) {
        logger.error(FILE_NAME, 'updateSMEProfile', requestId, {
            error,
            errorMessage: error.message,
            errorStack: error.stack,
            smeId: body.smeId
        });
        return {
            statusCode: 500,
            body: {
                message: 'Internal Server Error! Failed to update SME profile.',
            }
        };
    }
}