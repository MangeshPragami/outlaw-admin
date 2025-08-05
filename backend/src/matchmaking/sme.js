// src/routes/sme.js
import express from 'express';
import { 
  getAllSMEApplications,
  approveSMEApplication,
  rejectSMEApplication,
  getSMEProfile,
  updateSMEProfile,
  getAllApprovedSMEs,
  getSMEEfforts,
  updateSMEEffortRecord,
  getSMEPerformanceAnalytics,
  suspendSME,
  reactivateSME
} from '../controllers/smeController.js';

const router = express.Router();

// SME Applications management
router.get('/applications', getAllSMEApplications);
router.post('/:smeId/approve', approveSMEApplication); // Changed from PUT to POST to match frontend
router.post('/:smeId/reject', rejectSMEApplication);   // Changed from PUT to POST to match frontend

// Get all approved SMEs with filtering
router.get('/approved', getAllApprovedSMEs);

// SME Profile management
router.get('/:smeId/profile', getSMEProfile);
router.put('/:smeId/profile', updateSMEProfile);

// SME Performance and Analytics
router.get('/:smeId/performance', getSMEPerformanceAnalytics); // Updated route name to match frontend
router.get('/:smeId/efforts', getSMEEfforts);
router.put('/efforts/:effortId', updateSMEEffortRecord);

// SME Status management
router.post('/:smeId/suspend', suspendSME);
router.post('/:smeId/reactivate', reactivateSME);

// SME Overview route - using getAllApprovedSMEs for now
router.get('/overview', getAllApprovedSMEs);

export default router;