// src/routes/sme.js
import express from 'express';
import {
  listApplications,
  getApplication,
  approveApplication,
  rejectApplication,
  bulkAction,
  listProfiles,
  updateProfile,
  updateAvailability
} from '../controllers/smeController.js';

const router = express.Router();

// SME Applications Management
router.get('/applications', listApplications);
router.get('/applications/:id', getApplication);
router.post('/applications/:id/approve', approveApplication);
router.post('/applications/:id/reject', rejectApplication);
router.post('/applications/bulk-action', bulkAction);

// SME Profile Management
router.get('/profiles', listProfiles);
router.put('/profiles/:id', updateProfile);
router.post('/profiles/:id/availability', updateAvailability);

// SME Efforts & Payout Tracking (Placeholder)
router.get('/efforts', (req, res) => res.json({ message: 'SME Efforts & Payout Tracking - Coming soon' }));

// Chime Meeting Management (Placeholder)
router.get('/meetings', (req, res) => res.json({ message: 'Chime Meeting Management - Coming soon' }));

export default router;