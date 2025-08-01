import fs from 'node:fs';
import Redis from "ioredis";
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

import { config } from 'dotenv';
import { Sequelize } from 'sequelize';
import { logger } from '../logger/logger.js';
import { ideaSchema } from './models/idea.js';
import { formSchema } from './models/forms.js';
import { TABLE_NAMES } from '../helper/constants.js';
import { bookingsSchema } from './models/bookings.js';
import { formResponseSchema } from './models/form_responses.js';
import { userInformationSchema, userSchema } from './models/users.js';
import {otpSchema} from "./models/otp.js";
config();

const sequelize = new Sequelize({
    dialect: 'postgres',
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    dialectOptions: {
        ssl: {
            require: true,
            ca: fs.readFileSync(path.join(__dirname, 'cert', 'ap-south-1.bundle.pem'), 'utf8'),
        },
        statement_timeout: 10_000,
    },
    pool: {
        max: 2,
        min: 0,
        idle: 0,
        acquire: 3000,
        evict: 3000
    }
});

export const User = sequelize.isDefined('User')
    ? sequelize.models.User
    : sequelize.define(
        'User', 
        userSchema, 
        { 
            tableName: TABLE_NAMES.users,
            timestamps: true,
            createdAt: 'created_at',
            updatedAt: 'updated_at'
        }
    )

export const UserInformation = sequelize.isDefined('UserInformation')
    ? sequelize.models.UserInformation
    : sequelize.define(
        'UserInformation', 
        userInformationSchema, 
        { 
            tableName: TABLE_NAMES.user_information,
            timestamps: true,
            createdAt: 'created_at',
            updatedAt: 'updated_at'
        }
    )

export const Idea = sequelize.isDefined('Idea')
    ? sequelize.models.Idea
    : sequelize.define(
        'Idea', 
        ideaSchema, 
        { 
            tableName: TABLE_NAMES.ideas,
            timestamps: true,
            createdAt: 'created_at',
            updatedAt: 'updated_at'
        }
    )

export const Booking = sequelize.isDefined('Booking')
    ? sequelize.models.Booking
    : sequelize.define(
        'Booking', 
        bookingsSchema, 
        { 
            tableName: TABLE_NAMES.bookings,
            timestamps: true,
            createdAt: 'created_at',
            updatedAt: 'updated_at'
        }
    )

export const Form = sequelize.isDefined('Form')
    ? sequelize.models.Form
    : sequelize.define(
        'Form', 
        formSchema, 
        { 
            tableName: TABLE_NAMES.forms,
            timestamps: true,
            createdAt: 'created_at',
            updatedAt: 'updated_at'
        }
    )

export const FormResponses = sequelize.isDefined('FormResponses')
    ? sequelize.models.FormResponses
    : sequelize.define(
        'FormResponses', 
        formResponseSchema, 
        { 
            tableName: TABLE_NAMES.form_responses,
            timestamps: true,
            createdAt: 'created_at',
            updatedAt: 'updated_at'
        }
    )

export const Otp = sequelize.isDefined('Otp')
    ? sequelize.models.Otp
    : sequelize.define(
        'Otp',
        otpSchema,
        {
            tableName: TABLE_NAMES.otp,
            timestamps: true,
            createdAt: 'created_at',
            updatedAt: 'updated_at'
        }
    );

User.hasOne(UserInformation, {
    foreignKey: 'user_id',
    as: 'user_information',
});

UserInformation.belongsTo(User, {
    foreignKey: 'user_id',
    as: 'user'
});

User.hasMany(Idea, {
    foreignKey: 'user_id',
    as: 'ideas'
});

Idea.belongsTo(User, {
    foreignKey: 'user_id',
});

User.hasMany(Booking, {
    foreignKey: 'creator_id',
});

// Booking.belongsTo(User, {
//     foreignKey: 'creator_id',
// })
Booking.belongsTo(User, { as: 'creator', foreignKey: 'creator_id' });
Booking.belongsTo(User, { as: 'participant', foreignKey: 'participant_id' });

User.hasMany(Form, {
    foreignKey: 'creator_id',
});

User.hasMany(FormResponses, {
    foreignKey: 'responder_id',
});

Form.belongsTo(User, {
    foreignKey: 'creator_id',
    as: 'user',
});

FormResponses.belongsTo(User, {
    foreignKey: 'responder_id',
});

Form.belongsTo(Idea, {
    foreignKey: 'idea_id',
    as: 'idea',
});

User.hasMany(Otp, {
    foreignKey: 'user_id',
    as: 'otpUser',
})

Otp.belongsTo(User, {
    foreignKey: 'user_id',
    as: 'user'
});

export let cache = null;

let ready = false;
export async function init(requestId) {
    if (ready) return;
    await sequelize.authenticate();
    // let cacheReady = false;
    // if (!cache) {
    //     cache = new Redis({
    //         port: Number(process.env.REDIS_PORT || 6379),
    //         host: process.env.REDIS_HOST,
    //         connectTimeout: 5000,
    //         tls: {}
    //     });
    //
    //     const pong = await cache.ping();
    //     console.log('Ping Received: ', pong);
    //
    //     if (pong) {
    //         cacheReady = true;
    //     }
    // }
    // logger.debug('pool.js','init',requestId, {
    //    dbInit: true,
    //    cacheInit: cacheReady
    // })
    ready = true;
}

export default sequelize;
