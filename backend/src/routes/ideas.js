// src/routes/ideas.js
import express from 'express';
import { 
  getIdeasOverview, 
  getIdeasTrends, 
  getIdeasValidation,
  getAllIdeas,
  getIdeaById,
  deleteIdea,
  updateIdeaStage,
  updateIdeaStatus
} from '../controllers/ideasController.js';

const router = express.Router();

// Analytics endpoints (existing)
router.get('/overview', getIdeasOverview);
router.get('/trends', getIdeasTrends);
router.get('/validation', getIdeasValidation);

// CRUD endpoints for Ideas & Studies management
router.get('/', getAllIdeas);                    // Get all ideas
router.get('/:id', getIdeaById);                 // Get single idea
router.put('/:id/stage', updateIdeaStage);       // Update idea stage
router.put('/:id/status', updateIdeaStatus);     // Update idea status
router.delete('/:id', deleteIdea);               // Delete idea

export default router;