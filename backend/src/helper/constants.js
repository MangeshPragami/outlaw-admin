export const ADMIN_API_PATHS = {
    CREATE_MEETING : '/admin/create-meeting',
    CREATE_BOOKING : '/admin/create-booking',
        // New admin user management paths
    APPROVE_USER: '/admin/approve-user',
    CREATE_USER: '/admin/create-user',
    DELETE_USER: '/admin/delete-user',
    GET_ALL_USERS: '/admin/get-all-users',
    
    // SME Management paths
    GET_ALL_SME_APPLICATIONS: '/admin/get-all-sme-applications',
    APPROVE_SME_APPLICATION: '/admin/approve-sme-application',
    REJECT_SME_APPLICATION: '/admin/reject-sme-application',
    GET_ALL_APPROVED_SMES: '/admin/get-all-approved-smes',
    GET_SME_EFFORTS: '/admin/get-sme-efforts',
    UPDATE_SME_PROFILE: '/admin/update-sme-profile',
};



export const API_PATHS = {
    LOGIN: '/login',
    SIGNUP: '/signup',
    VERIFY_OTP: '/verify-otp',
    HELLO: '/hello',
    CREATE_ROLE: '/create-role',
    USER_INFORMATION: '/user-information',
    ME: '/me',
    CREATE_IDEA: '/create-idea',
    GET_LATEST_IDEA: '/get-latest-idea',
    STORE_IDEA: '/store-idea',
    GET_STORE_IDEA: '/get-store-idea',
    STORE_BURNING_PROBLEM: '/store-burning-problem',
    IDEA_LENS_SELECTOR: '/idea-lens-selector',
    GET_IDEAS: '/get-ideas',
    CREATE_BOOKING: '/create-booking',
    UPDATE_BOOKING: '/update-booking',
    GET_BOOKING: '/get-booking',
    CREATE_MEETING: '/create-meeting',
    GET_BOOKINGS: '/get-bookings',
    GET_AVAILABLE_SLOTS: '/get-available-slots',
    FORGOT_PASSWORD: '/forgot-password',
    RESET_PASSWORD: '/reset-password',
    RESEND_OTP: '/resend-otp',
    GOOGLE_OAUTH: '/google-oauth',
    GOOGLE_SIGNUP: '/google-signup',
    GOOGLE_LOGIN: '/google-login',
    ONBOARD_USER: '/onboard-user',
    REGENERATE_IDEA: '/regenerate-idea',
    GET_FORM: '/get-form',
    RETRY_FORM: '/retry-form',
    CREATE_FORM: '/create-form',
    GET_FORM_RESPONSE: '/get-form-response',
    GET_ALL_FORM_RESPONSE: '/get-all-form-response',
    RETRY_FORM_RESPONSE: '/retry-form-response',
    CREATE_FORM_RESPONSE: '/create-form-response',
    SEARCH_USERS: '/search-users',
    GET_IDEA_BY_ID: '/get-idea-by-id',
    IDEA_SURVEY_GENERATOR: '/idea-survey-generator',
    GET_PUBLIC_FORM: '/get-public-form',
    GET_FORMS: '/get-forms',
    GET_USER_DETAILS: '/get-user-details',
    SME_MATCHMAKING: '/matchmake/sme',
    GET_USER_CONSENT: '/user-consent/verify',
    UPDATE_USER_CONSENT: '/user-consent/provide',
    GOOGLE_AUTH: '/google-auth',
        // ===== ANALYTICS LAMBDA FUNCTIONS =====
    HEALTH_CHECK: '/health',
    USER_OVERVIEW: '/user-overview',
    USER_GROWTH: '/user-growth',
    USER_DEMOGRAPHICS: '/user-demographics',
    IDEAS_OVERVIEW: '/ideas-overview',
    FORMS_OVERVIEW: '/forms-overview',
    SME_OVERVIEW: '/sme-overview',
    BOOKINGS_OVERVIEW: '/bookings-overview',
    CHIME_OVERVIEW: '/chime-overview',
    CHIME_TRANSCRIPTS: '/chime-transcripts',
    ENGAGEMENT_FUNNEL: '/engagement-funnel',
    REALTIME_DASHBOARD: '/realtime-dashboard',
}

export const USER_ROLES = {
    FOUNDER: 'founder',
    SME: 'sme',
    RESPONDENT: 'respondent',
    NOT_SELECTED: 'not_selected'
}

export const AUTH_TYPE = {
    GOOGLE: 'google',
    EMAIL: 'email',
}

export const BOOKING_STATUSES = {
    PENDING: 'pending', // inital status
    SCHEDULED: 'scheduled', // if participant accepts
    ONGOING: 'ongoing', // if meeting startTime has been crossed
    COMPLETED: 'completed', // if meeting has ended
    CANCELLED: 'cancelled', // if creator deletes meeting
    DECLINED: 'declined' // if participant declines request
}

export const ATTENDEE_STATUSES = {
    JOINED: 'joined',
    DROPPED: 'dropped',
    NOT_JOINED: 'not_joined'
}

export const DEFAULT_TIME_SLOTS = [
    {
        day: 1,
        times: [
            {
                startTime: {
                    hours: 9,
                    minutes: 0
                },
                endTime: {
                    hours: 17,
                    minutes: 0
                }
            }
        ]
    },
    {
        day: 2,
        times: [
            {
                startTime: {
                    hours: 9,
                    minutes: 0
                },
                endTime: {
                    hours: 17,
                    minutes: 0
                }
            }
        ]
    },
    {
        day: 3,
        times: [
            {
                startTime: {
                    hours: 9,
                    minutes: 0
                },
                endTime: {
                    hours: 17,
                    minutes: 0
                }
            }
        ]
    },
    {
        day: 4,
        times: [
            {
                startTime: {
                    hours: 9,
                    minutes: 0
                },
                endTime: {
                    hours: 17,
                    minutes: 0
                }
            }
        ]
    },
    {
        day: 5,
        times: [
            {
                startTime: {
                    hours: 9,
                    minutes: 0
                },
                endTime: {
                    hours: 17,
                    minutes: 0
                }
            }
        ]
    }
]

export const DB_ERRORS = {
    DB_01: {
        code: 'REQ400',
        message: 'Where parameter missing'
    }
}

export const EMAIL_USE_CASES = {
    OTP_VERIFICATION: 'otp_verification',
    FORGOT_PASSWORD: 'forgot_password'
}

export const TABLE_NAMES = {
    ideas: 'ideas',
    users: 'users',
    forms: 'forms',
    bookings: 'bookings',
    form_responses: 'form_responses',
    user_information: 'user_information',
    otp: 'otp'
}

// !need to complete this
export const VALID_USER_SEARCH_FILTERS = [
    'age',
    'country'
]
