import { DataTypes } from "sequelize"
import { now } from "sequelize/lib/utils"
import { TABLE_NAMES } from "../../helper/constants.js"

export const bookingsSchema = {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    status: {
        type: DataTypes.STRING,
        allowNull: false
    },
    creator_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: TABLE_NAMES.users,
            key: 'id'
        }
    },
    participant_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: TABLE_NAMES.users,
            key: 'id'
        }
    },
    start_time: {
        type: DataTypes.DATE,
        allowNull: false
    },
    end_time: {
        type: DataTypes.DATE,
        allowNull: false
    },
    virtual_conference_id: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    transcript_url: {
        type: DataTypes.TEXT
    },
    video_recording_url: {
        type: DataTypes.TEXT
    },
    chime_meeting_response: {
        type: DataTypes.JSON
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: now()
    },
    updated_at: {
        type: DataTypes.DATE,
        defaultValue: now()
    }
}