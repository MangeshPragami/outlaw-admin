import { DataTypes } from 'sequelize';
import { now } from 'sequelize/lib/utils';
import { TABLE_NAMES } from '../../helper/constants.js';

export const ideaSchema = {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: TABLE_NAMES.users,
            key: 'id'
        }
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    targeted_audience: {
        type: DataTypes.STRING,
        allowNull: false
    },
    stage: {
        type: DataTypes.STRING,
        allowNull: false
    },
    pitch_deck: {
        type: DataTypes.STRING
    },
    document: {
        type: DataTypes.STRING
    },
    voice_note: {
        type: DataTypes.STRING
    },
    idea_capture: {
        type: DataTypes.STRING
    },
    lens_selector: {
        type: DataTypes.STRING
    },
    ai_request_id: {
        type: DataTypes.STRING
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: now()
    },
    survey_generator: {
        type: DataTypes.STRING
    },
    updated_at: {
        type: DataTypes.DATE,
        defaultValue: now()
    }
}
