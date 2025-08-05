// backend/src/api/auth/auth.routes.js
import express from 'express';
import { login } from './auth.controller.js';
const router = express.Router();

// Route: POST /api/auth/login
router.post('/login', login);

export default router;