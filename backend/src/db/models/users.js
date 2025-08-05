import { DataTypes } from 'sequelize';
import { now } from "sequelize/lib/utils";
import { TABLE_NAMES } from '../../helper/constants.js';

export const userSchema = {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    password: {
        type: DataTypes.TEXT
    },
    temp_id: {
        type: DataTypes.STRING,
        allowNull: false
    },
    auth_type: {
        type: DataTypes.STRING,
        allowNull: false
    },
    persona_type: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email_verified_at: {
        type: DataTypes.DATE
    },
    consented_at: {
        type: DataTypes.DATE
    },
    deleted_at: {
        type: DataTypes.DATE
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: now()
    },
    updated_at: {
        type: DataTypes.DATE,
        defaultValue: now()
    }
};

export const userInformationSchema = {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: TABLE_NAMES.users,
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    age: {
        type: DataTypes.INTEGER
    },
    profile_title: {
        type: DataTypes.STRING
    },
    linkedin: {
        type: DataTypes.STRING
    },
    github: {
        type: DataTypes.STRING
    },
    cv_url: {
        type: DataTypes.STRING
    },
    industry: {
        type: DataTypes.STRING
    },
    country: {
        type: DataTypes.STRING
    },
    experience: {
        type: DataTypes.TEXT
    },
    description: {
        type: DataTypes.TEXT
    },
    avatar: {
        type: DataTypes.STRING
    },
    gender: {
        type: DataTypes.STRING
    },
    // Expected format: [{ day: 0, times: ['10:30-15:45', '16:00-17:00'] }]
    // If null, the code treats default value as Mon - Fri, 9:00 to 17:00
    available_time_slots: {
        type: DataTypes.ARRAY(DataTypes.JSONB)
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: now()
    },
    updated_at: {
        type: DataTypes.DATE,
        defaultValue: now()
    }
};
