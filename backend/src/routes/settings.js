// src/routes/settings.js
import express from 'express';
import { getAdminSettings, updatePassword } from '../controllers/settingsController.js';
const router = express.Router();

router.get('/', getAdminSettings);
router.post('/password', updatePassword);

export default router;
