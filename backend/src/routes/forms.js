// src/routes/forms.js
import express from 'express';
import { getFormsOverview } from '../controllers/formsController.js';
const router = express.Router();

router.get('/overview', getFormsOverview);
// Add CRUD routes for forms and responses as needed

export default router;
