// src/routes/ideas.js
import express from 'express';
import { 
  getIdeasOverview, 
  getIdeasTrends, 
  getIdeasValidation,
  getAllIdeas,
  getIdeaById,
  activateIdea,
  deactivateIdea,
  resetIdea,
  updateIdeaStage,
  getStudyAnalytics
} from '../controllers/ideasController.js';

const router = express.Router();

// Analytics endpoints (existing)
router.get('/overview', getIdeasOverview);
router.get('/trends', getIdeasTrends);
router.get('/validation', getIdeasValidation);
router.get('/analytics', getStudyAnalytics);

// CRUD endpoints for Ideas & Studies management
router.get('/', getAllIdeas);                    // Get all ideas with study progress
router.get('/:id', getIdeaById);                 // Get single idea with detailed info
router.put('/:id/stage', updateIdeaStage);       // Update idea stage
router.post('/:id/activate', activateIdea);      // Activate idea
router.post('/:id/deactivate', deactivateIdea);  // Deactivate idea
router.post('/:id/reset', resetIdea);            // Reset idea (clear all study data)

export default router;