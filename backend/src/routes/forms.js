// backend/src/routes/forms.js
import express from 'express';
import { 
  getFormsOverview,
  getAllSurveys,
  getSurveyById,
  createSurvey,
  updateSurvey,
  deleteSurvey,
  getSurveyAnalytics,
  getSurveysByIdea,
  startSurvey,
  stopSurvey
} from '../controllers/formsController.js';

const router = express.Router();

// ===== ANALYTICS ENDPOINTS =====
router.get('/overview', getFormsOverview);              // Original overview
router.get('/analytics', getSurveyAnalytics);          // Comprehensive analytics

// ===== SURVEY MANAGEMENT ENDPOINTS =====
router.get('/', getAllSurveys);                        // Get all surveys with analytics
router.get('/:id', getSurveyById);                     // Get single survey with details
router.post('/', createSurvey);                        // Create new survey
router.put('/:id', updateSurvey);                      // Update survey
router.delete('/:id', deleteSurvey);                   // Delete survey

// ===== SURVEY OPERATIONS =====
router.post('/:id/start', startSurvey);                // Start/activate survey
router.post('/:id/stop', stopSurvey);                  // Stop/deactivate survey

// ===== SURVEY BY STUDY =====
router.get('/idea/:ideaId', getSurveysByIdea);         // Get surveys for specific idea/study

export default router;