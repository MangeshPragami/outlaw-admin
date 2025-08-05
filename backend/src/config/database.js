    // backend/src/config/database.js
    import pg from 'pg';
    import dotenv from 'dotenv';

    // Load environment variables from .env file
    dotenv.config();

    // Using a connection pool is a best practice for managing database connections.
    const pool = new pg.Pool({
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT,
    });

    pool.on('connect', () => {
      console.log('✅ Connected to the PostgreSQL database!');
    });

    // A simple query function to use the pool throughout the application
    export const query = (text, params) => pool.query(text, params);
    