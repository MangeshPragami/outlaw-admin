// backend/server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { protect } from './src/middleware/auth.middleware.js';

// Import route handlers
import authRoutes from './src/api/auth/auth.routes.js'; // Uncomment when implemented
import userRoutes from './src/routes/users.js';
import ideasRoutes from './src/routes/ideas.js';
import formsRoutes from './src/routes/forms.js';
import smeRoutes from './src/routes/sme.js';
import settingsRoutes from './src/routes/settings.js';

dotenv.config();
const app = express();

// --- Core Middleware ---
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- API Routes ---
app.use('/api/auth', authRoutes); // Uncomment when implemented
app.use('/api/users', protect, userRoutes);
app.use('/api/ideas', protect, ideasRoutes);
app.use('/api/forms', protect, formsRoutes);
app.use('/api/sme', protect, smeRoutes);
app.use('/api/settings', protect, settingsRoutes);

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`🚀 Backend server running on http://localhost:${PORT}`));
