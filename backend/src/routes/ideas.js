// src/routes/ideas.js
import express from 'express';
import { getIdeasOverview, getIdeasTrends, getIdeasValidation } from '../controllers/ideasController.js';
const router = express.Router();

router.get('/overview', getIdeasOverview);
router.get('/trends', getIdeasTrends);
router.get('/validation', getIdeasValidation);

export default router;
