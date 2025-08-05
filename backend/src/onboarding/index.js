import axios from 'axios';
import { config } from 'dotenv';
import { getUser } from "../user/crud.js";
import { logger } from "../logger/logger.js";
import { USER_ROLES } from "../helper/constants.js";
import { getValidatedWorkingHours } from "../helper/helper.js";
import { updateUserInformation } from '../user_information/crud.js';
import {
    onBoardFounderValidation,
    onBoardRespondentValidation,
    onBoardSMEValidation
} from "../joi/validation.js";
config();

const FILE_NAME = '/onboarding/index.js';

const AI_PROFILE_EXTRACTOR_HOST = process.env.AI_PROFILE_EXTRACTOR_HOST;

export async function onBoardUser(payload) {
    
    const { userId, requestId, ...rest } = payload;

    try {
        const userDataFromDB = await getUser(
            {
                id: userId, deleted_at: null
            },
            null,
            ['id', 'persona_type'],
            requestId
        );

        if (userDataFromDB.error) {
            return userDataFromDB.errorData;
        }

        const usersData = userDataFromDB.data.user;

        switch (usersData.persona_type) {
            case USER_ROLES.FOUNDER: {
                
                const { headerError, bodyError } = onBoardFounderValidation(payload);
                
                if (headerError || bodyError) {
                    return {
                        statusCode: 400,
                        body: {
                            message: 'Oops! Something went wrong.',
                            error: 'Invalid payload ' + (headerError || bodyError.details.map(d => d.message).join('; '))
                        }
                    }
                }

                const validatedWorkingHours = getValidatedWorkingHours(payload.availableSlots);
                
                if (validatedWorkingHours.error) {
                    return validatedWorkingHours.errorData;
                }
                
                const updateUserInformationResponse = await updateUserInformation(
                    { user_id: userId }, 
                    {
                        name: payload.name,
                        country: payload.country,
                        avatar: payload.avatar || null,
                        profile_title: payload.profile_title || null,
                        description: payload.description || null,
                        experience: payload.experience || null,
                        industry: payload.industry || null,
                        linkedin: payload.linkedin || null,
                        github: payload.github || null,
                        available_time_slots: validatedWorkingHours.data.workingHours || [],
                        cv_url: payload.cv_url || null,
                        age: payload.age || null,
                        gender: payload.gender || null
                    },  
                    requestId,
                    true
                );

                if (updateUserInformationResponse.error) {
                    return updateUserInformationResponse.errorData;
                }

                await axios.post(AI_PROFILE_EXTRACTOR_HOST + "/Prod/extract", {
                    userId,
                    s3_url: payload.cv_url,
                    name: payload.name,
                    country: payload.country,
                    profile_title: payload.profile_title || null,
                    experience: payload.experience || null,
                    industry: payload.industry || null,
                    linkedin: payload.linkedin || null,
                    github: payload.github || null,
                    age: payload.age || null,
                    description: payload.description || null,
                    perona_type: USER_ROLES.FOUNDER,
                }).catch(error => {
                    logger.error(FILE_NAME, 'onBoardUser', requestId, {
                        useCase: 'ai extraction API failure',
                        error,
                        errorMessage: error.message,
                        errorStack: error.stack
                    });
                });
                break;
            }
            case USER_ROLES.SME: {
                const { headerError, bodyError } = onBoardSMEValidation(payload);
                if (headerError || bodyError) {
                    return {
                        statusCode: 400,
                        body: {
                            // message: 'Oops! Something went wrong.',
                            error: 'Invalid payload ' + (headerError || bodyError.details.map(d => d.message).join('; ')),
                            message: 'Invalid payload' + (headerError || bodyError.details.map(d => d.message).join(';'))
                        }
                    }
                }

                const validatedWorkingHours = getValidatedWorkingHours(payload.availableSlots);
                
                if (validatedWorkingHours.error) {
                    return validatedWorkingHours.errorData;
                }
                
                const updateUserInformationResponse = await updateUserInformation(
                    { user_id: userId }, 
                    {
                        name: payload.name,
                        country: payload.country,
                        avatar: payload.avatar || null,
                        profile_title: payload.profile_title || null,
                        experience: payload.experience || null,
                        industry: payload.industry || null,
                        description: payload.description || null,
                        linkedin: payload.linkedin || null,
                        github: payload.github || null,
                        available_time_slots: validatedWorkingHours.data.workingHours || [],
                        cv_url: payload.cv_url || null,
                        age: payload.age || null,
                        gender: payload.gender || null
                    },  
                    requestId,
                    true
                );

                if (updateUserInformationResponse.error) {
                    return updateUserInformationResponse.errorData;
                }

                await axios.post(AI_PROFILE_EXTRACTOR_HOST + "Prod/extract", {
                    userId,
                    s3_url: payload.cv_url,
                    name: payload.name,
                    country: payload.country,
                    profile_title: payload.profile_title || null,
                    experience: payload.experience || null,
                    industry: payload.industry || null,
                    linkedin: payload.linkedin || null,
                    github: payload.github || null,
                    age: payload.age || null,
                    description: payload.description || null,
                    perona_type: USER_ROLES.SME
                }).catch(error => {
                    logger.error(FILE_NAME, 'onBoardUser', requestId, {
                        useCase: 'ai extraction API failure',
                        error,
                        errorMessage: error.message,
                        errorStack: error.stack
                    });
                });
                break;
            }
            case USER_ROLES.RESPONDENT: {
                const { headerError, bodyError } = onBoardRespondentValidation(payload);
                if (headerError || bodyError) {
                    return {
                        statusCode: 400,
                        body: {
                            message: 'Oops! Something went wrong.',
                            error: 'Invalid payload ' + (headerError || bodyError.details.map(d => d.message).join('; '))
                        }
                    }
                }
                
                const updateUserInformationResponse = await updateUserInformation(
                    { user_id: userId }, 
                    {
                        name: payload.name,
                        country: payload.country,
                        age: payload.age,
                        gender: payload.gender,
                        avatar: null,
                        profile_title: null,
                        description: null,
                        experience: null,
                        industry: null,
                        linkedin: null,
                        github: null,
                        available_time_slots: [],
                        cv_url: null,
                    },  
                    requestId,
                    true
                );

                if (updateUserInformationResponse.error) {
                    return updateUserInformationResponse.errorData;
                }
                break;
            }
            default: {
                logger.error(FILE_NAME, 'onBoardUser', requestId, {
                    errorMessage: 'Invalid user type' + usersData.persona_type?.toString()
                });
                return {
                    statusCode: 401,
                    body: {
                        message: 'Please create persona first!'
                    }
                }
            }
        }

        return {
            statusCode: 201,
            body: {
                message: 'User successfully onboarded!'
            }
        }

    } catch (error) {
        logger.error(FILE_NAME, 'onBoardUser', requestId, {
            error,
            errorMessage: error.message,
            errorStack: error.stack
        });
        return {
            statusCode: 500,
            body: { message: 'Cannot onboard user at the moment.' }
        };
    }
}
