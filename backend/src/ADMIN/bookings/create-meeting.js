
import {
    ChimeSDKMeetingsClient,
    CreateAttendeeCommand,
    CreateMeetingCommand,
    StartMeetingTranscriptionCommand
} from "@aws-sdk/client-chime-sdk-meetings";
import {getBooking, updateBooking} from "../../bookings/crud.js";
import {getUsers} from "../../user/crud.js";
import {logger} from "../../logger/logger.js";
import {
    ChimeSDKMediaPipelinesClient,
    CreateMediaCapturePipelineCommand
} from "@aws-sdk/client-chime-sdk-media-pipelines";

const FILE_NAME = 'admin/create-meeting.js';

const chimeClient = new ChimeSDKMeetingsClient({ region: process.env.AWS_REGION });

function uuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = (Math.random() * 16) | 0,
            v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

export async function createMeeting(body) {
    const requestId = body.requestId;
    delete body.requestId;
    const bookingId = body.bookingId;
    if (!bookingId) {
        return {
            statusCode: 400,
            body: { message: 'bookingId is required' }
        };
    }
    try {
        // Fetch booking
        const bookingResult = await getBooking({ id: bookingId }, null, requestId);
        if (bookingResult.error || !bookingResult.data?.booking) {
            return {
                statusCode: 404,
                body: { message: 'Booking not found' }
            };
        }

        const booking = bookingResult.data.booking;

        // If meeting already exists, return the existing meeting details
        if (booking.chime_meeting_response) {
            return {
                statusCode: 200,
                body: {
                    Title: `meeting-${booking.virtual_conference_id}`,
                    Meeting: booking.chime_meeting_response.meetingResponse.Meeting,
                    Attendees: booking.chime_meeting_response.attendeeResponses
                }
            };
        }

        const title = `meeting-${uuid()}`;
        const region = process.env.AWS_REGION;

        // Create Chime Meeting
        const meetingCommand = new CreateMeetingCommand({
            ClientRequestToken: uuid(),
            MediaRegion: region,
            ExternalMeetingId: title.substring(0, 64)
        });
        const meetingResponse = await chimeClient.send(meetingCommand);

        // Start transcription for the meeting
        try {
            const transcriptionCommand = new StartMeetingTranscriptionCommand({
                MeetingId: meetingResponse.Meeting.MeetingId,
                TranscriptionConfiguration: {
                    EngineTranscribeSettings: {
                        EngineType: "awsTranscribe",
                        LanguageCode: "en-US",
                        Region: 'auto',
                    }
                }
            });
            await chimeClient.send(transcriptionCommand);
        } catch (transcriptionError) {
            logger.error(FILE_NAME, 'startTranscription', requestId, {
                error: transcriptionError,
                errorMessage: transcriptionError.message,
                errorStack: transcriptionError.stack
            });
        }


        // @todo use env var to get account id
        const AWS_ACCOUNT_ID = "069717477936";
        // Start Media Capture Pipeline
        try {
            const pipelineCommand = new CreateMediaCapturePipelineCommand({
                SourceType: 'ChimeSdkMeeting',
                SourceArn: `arn:aws:chime::${AWS_ACCOUNT_ID}:meeting:${meetingResponse.Meeting.MeetingId}`,
                SinkType: 'S3Bucket',
                SinkArn: `arn:aws:s3:::outlaw-meeting-transcripts-dev`, // Replace with your bucket
                ChimeSdkMeetingConfiguration: {
                    ArtifactsConfiguration: {
                        // Audio: { State: 'Enabled', MuxType: 'AudioOnly' },
                        // Video: { State: 'Enabled', MuxType: 'VideoOnly' },
                        // Content: { State: 'Enabled', MuxType: "ContentOnly" }, // screen share
                        TranscriptionMessages: { State: 'Enabled' } // captures transcript into S3
                    }
                }
            });

            const chimeMediaClient = new ChimeSDKMediaPipelinesClient({ region: "us-east-1" }); // must be the media pipeline-supported region

            const pipelineOutput = await chimeMediaClient.send(pipelineCommand);
        } catch (pipelineError) {
            logger.error(FILE_NAME, 'startMediaPipeline', requestId, {
                error: pipelineError,
                errorMessage: pipelineError.message,
                errorStack: pipelineError.stack
            });
        }

        // Fetch attendees from users table using creator_id and participant_id
        const userIds = [booking.creator_id, booking.participant_id];
        const usersResult = await getUsers(
            { id: userIds, deleted_at: null, },
            null,
            null,
            requestId
        );

        if (usersResult.error) {
            return usersResult.errorData;
        }
        
        let attendees = [];
        if (!usersResult.error && usersResult.data?.users) {
            if(usersResult.data?.users.length !== 2){
                throw new Error('Meeting Cant be generated');
            }
            // If getUser returns a single user, wrap in array
            attendees = usersResult.data.users;
        }

        const attendeeResponses = [];
        for (const attendee of attendees) {
            const attendeeName = attendee.name || attendee.full_name || attendee.email || `user-${attendee.id}`;
            const attendeeCommand = new CreateAttendeeCommand({
                MeetingId: meetingResponse.Meeting.MeetingId,
                ExternalUserId: uuid()
            });
            const attendeeResponse = await chimeClient.send(attendeeCommand);
            attendeeResponses.push({
                Name: attendeeName,
                Attendee: attendeeResponse.Attendee
            });
        }


        // Update booking with Chime meeting info
        const updateResult = await updateBooking(
            { id: bookingId },
            {
                chime_meeting_response: {meetingResponse, attendeeResponses},
                virtual_conference_id: meetingResponse.Meeting.MeetingId,
                status: 'scheduled'
            },
            requestId
        );
        
        if (updateResult.error) {
            throw new Error('Failed to update booking with meeting details');
        }

        return {
            statusCode: 200,
            body: {
                Title: title,
                Meeting: meetingResponse.Meeting,
                Attendees: attendeeResponses
            }
        };
    } catch (error) {
        logger.error(FILE_NAME, 'createMeeting', requestId, {
            error,
            errorMessage: error.message,
            errorStack: error.stack
        });
        return {
            statusCode: 500,
            body: {
                message: 'Could not create meeting'
            }
        };
    }
}
