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

// SME Overview route - using getAllApprovedSMEs for now
router.get('/overview', getAllApprovedSMEs);

// SME Applications management
router.get('/applications', getAllSMEApplications);
router.put('/:smeId/approve', approveSMEApplication);
router.put('/:smeId/reject', rejectSMEApplication);

// SME Profile management
router.get('/:smeId/profile', getSMEProfile);
router.put('/:smeId/profile', updateSMEProfile);

// SME Performance and Analytics
router.get('/:smeId/analytics', getSMEPerformanceAnalytics);
router.get('/:smeId/efforts', getSMEEfforts);
router.put('/efforts/:effortId', updateSMEEffortRecord);

// SME Status management
router.post('/:smeId/suspend', suspendSME);
router.post('/:smeId/reactivate', reactivateSME);

// Get all approved SMEs with filtering
router.get('/approved', getAllApprovedSMEs);

export default router;