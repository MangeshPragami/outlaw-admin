// src/routes/sme.js
import express from 'express';
import * as smeController from '../controllers/smeController.js';

const router = express.Router();

// SME Overview route - using getAllApprovedSMEs for now
router.get('/overview', smeController.getAllApprovedSMEs);

// SME Applications management
router.get('/applications', smeController.getAllSMEApplications);
router.get('/applications/:id', smeController.getApplication);
router.post('/applications/:id/approve', smeController.approveApplication);
router.post('/applications/:id/reject', smeController.rejectApplication);
router.post('/applications/bulk-action', smeController.bulkAction);

// SME Profile management
router.get('/profiles', smeController.listProfiles);
router.get('/:smeId/profile', smeController.getSMEProfile);
router.put('/profiles/:id', smeController.updateProfile);
router.put('/:smeId/profile', smeController.updateSMEProfile);
router.post('/profiles/:id/availability', smeController.updateAvailability);

// SME Performance and Analytics
router.get('/:smeId/analytics', smeController.getSMEPerformanceAnalytics);
router.get('/:smeId/efforts', smeController.getSMEEfforts);
router.put('/efforts/:effortId', smeController.updateSMEEffortRecord);

// SME Status management
router.post('/:smeId/suspend', smeController.suspendSME);
router.post('/:smeId/reactivate', smeController.reactivateSME);

// Get all approved SMEs with filtering
router.get('/approved', smeController.getAllApprovedSMEs);

// SME Efforts & Payout Tracking (Placeholder)
router.get('/efforts', (req, res) => res.json({ message: 'SME Efforts & Payout Tracking - Coming soon' }));

// Chime Meeting Management (Placeholder)
router.get('/meetings', (req, res) => res.json({ message: 'Chime Meeting Management - Coming soon' }));

export default router;