import { config } from 'dotenv';
import { me } from './src/user/me.js';
import { init } from './src/db/pool.js';
import { hello } from './src/auth/hello.js';
import { login } from './src/auth/login.js';
import { signup } from './src/auth/signup.js';
import { getFormAPI } from './src/forms/read.js';
import { storeIdea } from './src/idea/storeIdea.js';
import { getIdeasAPI } from './src/idea/getIdeas.js';
import { resendOTP } from './src/auth/resendOTP.js';
import { verifyOtp } from './src/auth/verifyOtp.js';
import { createIdeaAPI } from './src/idea/createIdea.js';
import {ADMIN_API_PATHS, API_PATHS} from './src/helper/constants.js';
import { createFormAPI } from './src/forms/create.js';
import { onBoardUser } from './src/onboarding/index.js';
import { googleLogin } from './src/auth/google/login.js';
import { getIdeaById } from './src/idea/getIdeaById.js';
import { getStoreIdea } from './src/idea/getStoreIdea.js';
import { googleSignup } from './src/auth/google/signup.js';
import { createFormS3LinkAPI } from './src/forms/retry.js';
import { createBookingAPI } from './src/bookings/create.js';
import { getLatestIdea } from './src/idea/getLatestIdea.js';
import { updateBookingAPI } from './src/bookings/update.js';
import { resetPassword } from './src/auth/resetPassword.js';
import { regenerateIdea } from './src/idea/regenerateIdea.js';
import { searchUsersAPI } from './src/marketplace/search.js';
import { createUserRole } from './src/auth/createUserRole.js';
import { forgotPassword } from './src/auth/forgotPassword.js';
import { userInformation } from './src/user/userInformation.js';
import { ideaLensSelector } from './src/idea/ideaLensSelector.js';
import { createFormResponseAPI } from './src/form_responses/create.js';
import { getBookingAPI, getBookingsAPI } from './src/bookings/read.js';
import { getAvailableSlots } from './src/bookings/getAvailableSlots.js';
import { storeBurningProblem } from './src/idea/storeBurningProblem.js';
import { createFormResponseS3LinkAPI } from './src/form_responses/retry.js';
import { getFormResponseAPI, getFormResponsesAPI } from './src/form_responses/read.js';
import { parseStringifiedBody, extractTokenFromHeaders, verifyAuthToken } from './src/helper/helper.js';
import {ideaSurveyGenerator} from "./src/idea/ideaSurveyGenerator.js";
import {getPublicForm} from "./src/forms/getPublicForm.js";
import {getForms} from "./src/forms/getForms.js";
import {getForm} from "./src/forms/getForm.js";
import {createResponse} from "./src/form_responses/createResponse.js";
import { getUserDetails } from './src/auth/getUser.js';
import { smeMatchmakingAPI } from './src/matchmaking/SMEMatchmaking.js';
import { logger } from './src/logger/logger.js';
import { getUserConsent } from './src/auth/getUserConsent.js';
import { updateUserConsent } from './src/auth/updateUserConsent.js';
import {createMeeting as createMeetingAdmin} from "./src/ADMIN/bookings/create-meeting.js";
import {createBookingAdmin } from "./src/ADMIN/bookings/create.js";
import {createMeeting } from "./src/bookings/create-meeting.js";
import {googleLoginOrSignup} from "./src/auth/google/googleLoginOrSignup.js";

config();

const FILE_NAME = 'root/server.js';

export const app = async (event, context, requestId) => {
    console.log({
        event, context, requestId
    });

    try {
        // Initialize database connection
        await init(requestId);
        
        // Parse body - handle different Lambda event structures
        let body;
        if (event.body) {
            body = parseStringifiedBody(event.body);
        } else {
            body = {};
        }
        body.requestId = requestId;

        // Handle different Lambda event structures for path
        let path = event.rawPath || event.path || event.resource || '/';
        
        // Clean up path - remove stage prefix if present
        if (path.includes('/default')) {
            path = path.replace('/default', '');
        }
        if (path.includes('/dev')) {
            path = path.replace('/dev', '');
        }
        if (path.includes('/prod')) {
            path = path.replace('/prod', '');
        }

        // Ensure path starts with /
        if (!path.startsWith('/')) {
            path = '/' + path;
        }

        console.log(`Processing request: ${event.httpMethod || event.requestContext?.http?.method || 'POST'} ${path}`);

        const skipMiddleWareForRoutes = [
            API_PATHS.LOGIN,
            API_PATHS.SIGNUP,
            API_PATHS.RESET_PASSWORD,
            API_PATHS.FORGOT_PASSWORD,
            API_PATHS.HELLO,
            API_PATHS.GOOGLE_OAUTH,
            API_PATHS.GOOGLE_SIGNUP,
            API_PATHS.GOOGLE_LOGIN,
            API_PATHS.RESEND_OTP,
            API_PATHS.VERIFY_OTP,
            API_PATHS.GET_PUBLIC_FORM,
            API_PATHS.GOOGLE_AUTH
        ];

        // Authentication middleware
        if (!skipMiddleWareForRoutes.includes(path)) {
            // role based and token authentication
            const tokenFromHeaders = extractTokenFromHeaders(event.headers || {});
            if (!tokenFromHeaders) {
                return {
                    statusCode: 401,
                    body: {
                        error: 'Unauthorized Request! Auth Token missing'
                    }
                };
            }

            const authResult = verifyAuthToken(tokenFromHeaders);
            if (!authResult || !authResult.userId) {
                return {
                    statusCode: 401,
                    body: {
                        error: 'Unauthorized Request! Auth Token expired or invalid'
                    }
                };
            }

            const { userId, persona_type } = authResult;

            // Check for admin routes
            const isAdminRoute = Object.values(ADMIN_API_PATHS).some(apiPath => path === apiPath);
            if (isAdminRoute && persona_type !== 'admin') {
                return {
                    statusCode: 403,
                    body: {
                        error: 'Forbidden! Admin access required'
                    }
                };
            }

            body.userId = userId;
        }

        // Security check for SQL injection
        if (body.userId && isNaN(Number(body.userId))) {
            logger.warn(FILE_NAME, 'app', requestId, {
                message: 'Possible SQL Injection attempt on users table!',
                data: {
                    userId: body.userId,
                    type: typeof body.userId
                }
            });
            return {
                statusCode: 400,
                body: {
                    message: 'Invalid userId format'
                }
            };
        }

        // Route handling
        switch (path) {
            case API_PATHS.LOGIN: {
                return await login(body);
            }
            case API_PATHS.GOOGLE_SIGNUP: {
                return await googleSignup(body);
            }
            case API_PATHS.GOOGLE_LOGIN: {
                return await googleLogin(body);
            }
            case API_PATHS.SIGNUP: {
                return await signup(body);
            }
            case API_PATHS.VERIFY_OTP: {
                return await verifyOtp(body);
            }
            case API_PATHS.HELLO: {
                // Test route, to be removed later
                return await hello();
            }
            case API_PATHS.CREATE_ROLE: {
                return await createUserRole(body);
            }
            case API_PATHS.USER_INFORMATION: {
                return await userInformation(body); // update profile
            }
            case API_PATHS.ME: {
                return await me(body); // fetch profile
            }
            case API_PATHS.CREATE_IDEA: {
                // Idea Capture, when user enters details and pitch deck files
                return await createIdeaAPI(body);
            }
            case API_PATHS.GET_LATEST_IDEA: {
                // TODO: check usage
                return await getLatestIdea(body);
            }
            case API_PATHS.STORE_IDEA: {
                // When user accepts AI generated idea response
                return await storeIdea(body);
            }
            case API_PATHS.REGENERATE_IDEA: {
                // When user asks to regenerate AI response
                return await regenerateIdea(body);
            }
            case API_PATHS.GET_STORE_IDEA: {
                // In case user goes back to idea capture phase
                return await getStoreIdea(body);
            }
            case API_PATHS.STORE_BURNING_PROBLEM: {
                // Stores users entered burning problems
                return await storeBurningProblem(body);
            }
            case API_PATHS.IDEA_LENS_SELECTOR: {
                // Last step of idea capture phase, calls Lens Selector AI
                return await ideaLensSelector(body);
            }
            case API_PATHS.GET_IDEAS: {
                return await getIdeasAPI(body);
            }
            case API_PATHS.GET_IDEA_BY_ID: {
                return await getIdeaById(body);
            }
            case API_PATHS.IDEA_SURVEY_GENERATOR: {
                return await ideaSurveyGenerator(body);
            }
            case API_PATHS.CREATE_BOOKING: {
                return await createBookingAPI(body);
            }
            case API_PATHS.UPDATE_BOOKING: {
                return await updateBookingAPI(body);
            }
            case API_PATHS.GET_BOOKING: {
                return await getBookingAPI(body);
            }
            case API_PATHS.GET_BOOKINGS: {
                return await getBookingsAPI(body);
            }
            case API_PATHS.CREATE_MEETING: {
                return await createMeeting(body);
            }
            case API_PATHS.GET_AVAILABLE_SLOTS: {
                return await getAvailableSlots(body);
            }
            case API_PATHS.FORGOT_PASSWORD: {
                return await forgotPassword(body);
            }
            case API_PATHS.RESEND_OTP: {
                return await resendOTP(body);
            }
            case API_PATHS.RESET_PASSWORD: {
                body.token = extractTokenFromHeaders(event.headers || {});
                return await resetPassword(body);
            }
            case API_PATHS.ONBOARD_USER: {
                return await onBoardUser(body);
            }
            case API_PATHS.GET_FORM: {
                return await getForm(body);
            }
            case API_PATHS.RETRY_FORM: {
                return await createFormS3LinkAPI(body);
            }
            case API_PATHS.CREATE_FORM: {
                return await createFormAPI(body);
            }
            case API_PATHS.GET_FORM_RESPONSE: {
                return await getFormResponseAPI(body);
            }
            case API_PATHS.GET_ALL_FORM_RESPONSE: {
                return await getFormResponsesAPI(body);
            }
            case API_PATHS.RETRY_FORM_RESPONSE: {
                return await createFormResponseS3LinkAPI(body);
            }
            case API_PATHS.CREATE_FORM_RESPONSE: {
                return await createResponse(body);
            }
            case API_PATHS.SEARCH_USERS: {
                return await searchUsersAPI(body);
            }
            case API_PATHS.GET_PUBLIC_FORM: {
                return await getPublicForm(body);
            }
            case API_PATHS.GET_FORMS: {
                return await getForms(body);
            }
            case API_PATHS.GET_USER_DETAILS: {
                return await getUserDetails(body);
            }
            case API_PATHS.SME_MATCHMAKING: {
                return await smeMatchmakingAPI(body);
            }
            case API_PATHS.GET_USER_CONSENT: {
                return await getUserConsent(body);
            }
            case API_PATHS.UPDATE_USER_CONSENT: {
                return await updateUserConsent(body);
            }
            case API_PATHS.GOOGLE_AUTH: {
                return await googleLoginOrSignup(body);
            }
            
            /**
             * ADMIN ROUTES
             */
            case ADMIN_API_PATHS.CREATE_MEETING: {
                // expects only bookingId in body
                return await createMeetingAdmin(body);
            }
            case ADMIN_API_PATHS.CREATE_BOOKING: {
                // expects only bookingId in body
                return await createBookingAdmin(body);
            }
            
            // Health check route
            case '/health':
            case '/ping': {
                return {
                    statusCode: 200,
                    body: {
                        status: 'OK',
                        timestamp: new Date().toISOString(),
                        environment: process.env.NODE_ENV || 'production',
                        requestId
                    }
                };
            }
            
            default: {
                return {
                    statusCode: 404,
                    body: {
                        message: `Route ${path} not found`,
                        availableRoutes: [...Object.values(API_PATHS), ...Object.values(ADMIN_API_PATHS)]
                    }
                };
            }
        }
    } catch (error) {
        console.error('Server Error:', {
            error: error.message,
            stack: error.stack,
            requestId
        });
        
        logger.error(FILE_NAME, 'app', requestId, {
            message: 'Unhandled server error',
            error: error.message,
            stack: error.stack
        });
        
        return {
            statusCode: 500,
            body: {
                error: 'Internal server error',
                requestId,
                message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
            }
        };
    }
};