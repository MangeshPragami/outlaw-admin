// backend/server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { protect } from './src/middleware/auth.middleware.js';

// Import route handlers
import bookingsRoutes from './src/routes/bookings.js';
import authRoutes from './src/api/auth/auth.routes.js';
import userRoutes from './src/routes/users.js';
import ideasRoutes from './src/routes/ideas.js';
import formsRoutes from './src/routes/forms.js';
import smeRoutes from './src/routes/sme.js';
import settingsRoutes from './src/routes/settings.js';
import analyticsRoutes from './src/routes/analytics.js';

dotenv.config();
const app = express();

// --- Core Middleware ---
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- API Routes ---
app.use('/api/bookings', bookingsRoutes); // This should work now
app.use('/api/auth', authRoutes);
app.use('/api/users', protect, userRoutes);
app.use('/api/ideas', protect, ideasRoutes);
app.use('/api/forms', protect, formsRoutes);
app.use('/api/sme', protect, smeRoutes);
app.use('/api/settings', protect, settingsRoutes);
app.use('/api/analytics', analyticsRoutes);

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`🚀 Backend server running on http://localhost:${PORT}`));