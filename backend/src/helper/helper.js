import jwt from 'jsonwebtoken';
import { config } from "dotenv";
import { cache } from '../db/pool.js';
import { TOTP } from "totp-generator"
import { logger } from '../logger/logger.js';
import { DEFAULT_TIME_SLOTS } from './constants.js';
config();

const TOTP_SECRET = process.env.TOTP_SECRET;
const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;
const EMAIL_OTP_EXPIRES_IN = +(process.env.EMAIL_OTP_EXPIRES_IN) || 900;
const MEETING_DURATION_IN_MINUTES = process.env.MEETING_DURATION_IN_MINUTES;
const FORGOT_PASSWORD_LINK_EXPIRES_IN_MINUTES = +(process.env.FORGOT_PASSWORD_LINK_EXPIRES_IN_MINUTES) || 60;

const FILE_NAME = 'helper.js';

export function getTimeStampForDataBase(timestamp) {
    return new Date(timestamp).toUTCString();
}

export const parseStringifiedBody = (stringBody) => {
    try {
        return JSON.parse(stringBody);
    } catch (error) {
        return {};
    }
}

export const extractTokenFromHeaders = (headers) => {
    const authHeader = headers?.authorization || headers?.Authorization;
    return authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
}

export const verifyAuthToken = (token) => {
    try {
        const decoded = jwt.verify(token, JWT_SECRET_KEY);

        if (decoded.iat >= decoded.exp) {
            return { userId: null, persona_type: null }
        }

        const userId = decoded.userId;
        const persona_type = decoded.persona_type || 'not_selected'; // default to 'user' if not specified

        return { userId, persona_type }
    } catch (err) {
        return { userId: null, persona_type: null }
    }
}

export function getEmailVerificationCacheKey(email) {
    return email + '_verify_otp';
}

export function getResendOTPCacheKey(email) {
    return email + '_resend_otp';
}

export function getForgotPasswordCacheKey(email) {
    return email + '_forgot_password';
}

export function getResetPasswordCacheKey(email) {
    return email + '_reset_password';
}

export function getBookingCreatorCacheKey(userId, startTime) {
    if (typeof userId === 'string') return userId + startTime.toString() + '_creator_booking';
    return userId.toString() + startTime.toString() + '_creator_booking';
}

export function getBookingParticipantCacheKey(userId, startTime) {
    if (typeof userId === 'string') return userId + startTime.toString() + '_participant_booking';
    return userId.toString() + startTime.toString() + '_participant_booking';
}

export async function getResendOTPRateLimits(email) {
    const redisKey = getResendOTPCacheKey(email);
    return await cache.get(redisKey);
}

export async function setResendOTPRateLimits(email) {
    const redisKey = getResendOTPCacheKey(email);
    const existingRateLimitCount = +(await getResendOTPRateLimits(email)) || 0;
    await cache.set(redisKey, existingRateLimitCount + 1, 'EX', EMAIL_OTP_EXPIRES_IN);
}

export async function getForgotPasswordRateLimits(email) {
    const redisKey = getForgotPasswordCacheKey(email);
    return await cache.get(redisKey);
}

export async function setForgotPasswordRateLimits(email) {
    const redisKey = getForgotPasswordCacheKey(email);
    const existingRateLimitCount = +(await getForgotPasswordRateLimits(email)) || 0;
    await cache.set(redisKey, existingRateLimitCount + 1, 'EX', FORGOT_PASSWORD_LINK_EXPIRES_IN_MINUTES);
}

export async function getExistingOTP(email) {
    const redisKey = getEmailVerificationCacheKey(email);
    return parseStringifiedBody(await cache.get(redisKey));
}

export async function createTOTP(email) {
    const { otp } = TOTP.generate(TOTP_SECRET);
    const redisKey = getEmailVerificationCacheKey(email);
    await cache.set(redisKey, JSON.stringify({ otp }), 'NX', 'EX', EMAIL_OTP_EXPIRES_IN);
    return otp;
}

export async function generateRandom(n) {
    if (n <= 0) return "";

    const min = Math.pow(10, n - 1);
    const max = Math.pow(10, n) - 1;

    const number = Math.floor(Math.random() * (max - min + 1)) + min;

    return number.toString();
}

// Worst Case: O(n^2logn) due to sorting, but since n <= 7, TC and SC does not matter.
export function getWorkingHours(workingHoursData, requestId) {
    const workingHoursInformation = [];
    try {
        if (!workingHoursData) {
            return DEFAULT_TIME_SLOTS;
        }

        if (typeof workingHoursData === 'string') {
            workingHoursData = JSON.parse(workingHoursData);
        }
   
        if (Array.isArray(workingHoursData)) {
            
            workingHoursData.sort((a, b) => +a.day - +b.day);
            
            for (const workingHoursObj of workingHoursData) {
                if ((workingHoursObj.day >= 0 && workingHoursObj.day <= 6) && Array.isArray(workingHoursObj.times)) {
                    workingHoursInformation.push({
                        day: +workingHoursObj.day,
                        times: workingHoursObj.times.map((timesObj) => {
                            let tempSplit = timesObj.split('-');

                            let startMinutes = +(MEETING_DURATION_IN_MINUTES * Math.ceil(+tempSplit[0].split(':')[1] / MEETING_DURATION_IN_MINUTES));
                            if (startMinutes > 60) startMinutes = startMinutes % 60;

                            let endMinutes = +(MEETING_DURATION_IN_MINUTES * Math.ceil(+tempSplit[1].split(':')[1] / MEETING_DURATION_IN_MINUTES));
                            if (endMinutes > 60) endMinutes = endMinutes % 60;
                            return {
                                startTime: {
                                    hours: +tempSplit[0].split(':')[0],
                                    minutes: +startMinutes
                                },
                                endTime: {
                                    hours: +tempSplit[1].split(':')[0],
                                    minutes: endMinutes
                                },
                            };
                        }).sort((a, b) => a.startTime.hours - b.startTime.hours)
                    });
                }
            }

            return workingHoursInformation;
        }

        return DEFAULT_TIME_SLOTS;
    } catch (error) {
        logger.error(FILE_NAME, 'getWorkingHours', requestId, {
            error,
            errorMessage: error.message,
            errorStack: error.stack
        });
        return DEFAULT_TIME_SLOTS;
    }
}

function createTimeSlotForDB(value) {
    if (value < 10)
        return '0' + value.toString();
    return value.toString();
}

function parseTimeToMinutes(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
}

function hasOverlap(intervals) {
    intervals.sort((a, b) => a.start - b.start);
    for (let i = 1; i < intervals.length; i++) {
        if (intervals[i].start < intervals[i - 1].end) {
            return true;
        }
    }
    return false;
}

export function getValidatedWorkingHours(availableSlots, requestId) {
    try {

        for (const availableSlot of availableSlots) {
            const times = availableSlot.times;

            const parsedIntervals = [];

            /*
                Expectations:
                    Each time slot must be minimum 30 minutes
                    Each time slot must be non overlapping
            */

            for (const timeStr of times) {
                const [startStr, endStr] = timeStr.split('-');
                const start = parseTimeToMinutes(startStr);
                const end = parseTimeToMinutes(endStr);

                if (end - start < MEETING_DURATION_IN_MINUTES) {
                    return {
                        error: true,
                        errorData: {
                            statusCode: 400,
                            body: {
                                message: `Time slot is less than ${MEETING_DURATION_IN_MINUTES} minutes.`
                            }
                        }
                    }
                }

                parsedIntervals.push({ start, end });
            }

            if (hasOverlap(parsedIntervals)) {
                return {
                    error: true,
                    errorData: {
                        statusCode: 400,
                        body: {
                            message: `Time slots for day ${availableSlot.day} overlap.`
                        }
                    }
                }
            }
        }

        return {
            error: false,
            data: {
                workingHours: availableSlots
            }
        }
    } catch (error) {
        logger.error(FILE_NAME, 'getValidatedWorkingHours', requestId, {
            error,
            errorMessage: 'error while validating working hours',
        })
        return {
            error: false,
            data: {
                workingHours: DEFAULT_TIME_SLOTS.map((workingHourObj) => {
                    return {
                        day: workingHourObj.day,
                        times: workingHourObj.times.map((timeObj) => {
                            return (
                                createTimeSlotForDB(timeObj.startTime.hours) + 
                                ':' + 
                                createTimeSlotForDB(timeObj.startTime.minutes) + 
                                '-' +
                                createTimeSlotForDB(timeObj.endTime.hours) + 
                                ':' +
                                createTimeSlotForDB(timeObj.endTime.minutes)
                            )
                        })
                    }
                })
            }
        }
    }
}
