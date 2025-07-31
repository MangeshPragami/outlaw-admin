// lambda/index.js - Main Lambda handler
import serverlessExpress from '@vendia/serverless-express';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { protect } from './src/middleware/auth.middleware.js';

// Import route handlers
import authRoutes from './src/api/auth/auth.routes.js';
import userRoutes from './src/routes/users.js';
import ideasRoutes from './src/routes/ideas.js';
import formsRoutes from './src/routes/forms.js';
import smeRoutes from './src/routes/sme.js';
import settingsRoutes from './src/routes/settings.js';
import analyticsRoutes from './src/routes/analytics.js';

// Load environment variables
dotenv.config();

const app = express();

// --- Core Middleware ---
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'https://your-frontend-domain.com'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// --- API Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/users', protect, userRoutes);
app.use('/api/ideas', protect, ideasRoutes);
app.use('/api/forms', protect, formsRoutes);
app.use('/api/sme', protect, smeRoutes);
app.use('/api/settings', protect, settingsRoutes);
app.use('/api/analytics', analyticsRoutes);

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Lambda Error:', error);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// Create serverless express handler
const serverlessExpressInstance = serverlessExpress({ app });

// Lambda handler function
export const handler = async (event, context) => {
  // Set context to not wait for empty event loop
  context.callbackWaitsForEmptyEventLoop = false;
  
  try {
    // Log the event for debugging (remove in production)
    if (process.env.NODE_ENV === 'development') {
      console.log('Lambda Event:', JSON.stringify(event, null, 2));
    }
    
    return await serverlessExpressInstance(event, context);
  } catch (error) {
    console.error('Lambda Handler Error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
      },
      body: JSON.stringify({
        error: 'Internal Server Error',
        message: 'Lambda function execution failed'
      })
    };
  }
};