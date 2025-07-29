// src/routes/sme.js
import express from 'express';
import { getSMEOverview, getSMEExpertise, getSMEPerformance } from '../controllers/smeController.js';
const router = express.Router();

router.get('/overview', getSMEOverview);
router.get('/expertise', getSMEExpertise);
router.get('/performance', getSMEPerformance);

export default router;
