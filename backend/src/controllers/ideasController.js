// src/controllers/ideasController.js
import pool from '../models/db.js';

// Get all ideas with study progress
export const getAllIdeas = async (req, res) => {
  try {
    // First, calculate dynamic thresholds based on actual data distribution
    const thresholdQuery = `
      SELECT 
        PERCENTILE_CONT(0.33) WITHIN GROUP (ORDER BY response_count) as low_threshold,
        PERCENTILE_CONT(0.66) WITHIN GROUP (ORDER BY response_count) as high_threshold,
        AVG(response_count) as avg_responses,
        MAX(response_count) as max_responses
      FROM (
        SELECT COUNT(fr.id) as response_count
        FROM ideas i
        LEFT JOIN forms f ON i.id = f.idea_id
        LEFT JOIN form_responses fr ON f.id = fr.form_id
        GROUP BY i.id
        HAVING COUNT(fr.id) > 0
      ) response_stats
    `;
    
    const thresholdResult = await pool.query(thresholdQuery);
    const thresholds = thresholdResult.rows[0];
    
    // Use dynamic thresholds, fallback to 1,2 if no data exists
    const lowThreshold = Math.max(1, Math.floor(thresholds?.low_threshold || 1));
    const highThreshold = Math.max(2, Math.floor(thresholds?.high_threshold || 2));
    
    const query = `
      SELECT 
        i.*,
        u.email as creator_email,
        u.temp_id as creator_name,
        f.id as form_id,
        f.form_url,
        f.start_time,
        f.end_time,
        COUNT(fr.id) as total_responses,
        CASE 
          WHEN i.stage = 'Inactive' THEN 'Inactive'
          WHEN f.id IS NULL THEN 'No Study Created'
          WHEN f.start_time IS NULL THEN 'Study Not Started'
          WHEN f.end_time IS NOT NULL AND f.end_time < NOW() THEN 'Study Completed'
          WHEN f.start_time IS NOT NULL AND f.start_time <= NOW() THEN 'Study Active'
          ELSE 'Study Scheduled'
        END as study_status,
        -- Calculate lens progress using dynamic thresholds from actual data
        CASE WHEN COUNT(fr.id) >= $1 THEN 'Completed' 
             WHEN COUNT(fr.id) >= $2 THEN 'In Progress' 
             ELSE 'Pending' END as sme_lens_status,
        CASE WHEN COUNT(fr.id) >= $1 THEN 'Completed' 
             WHEN COUNT(fr.id) >= $2 THEN 'In Progress' 
             ELSE 'Pending' END as survey_lens_status,
        CASE WHEN COUNT(fr.id) >= $1 THEN 'Completed' 
             WHEN COUNT(fr.id) >= $2 THEN 'In Progress' 
             ELSE 'Pending' END as social_lens_status,
        CASE WHEN COUNT(fr.id) >= $1 THEN 'Completed' 
             WHEN COUNT(fr.id) >= $2 THEN 'In Progress' 
             ELSE 'Pending' END as peer_lens_status
      FROM ideas i
      LEFT JOIN users u ON i.user_id = u.id
      LEFT JOIN forms f ON i.id = f.idea_id
      LEFT JOIN form_responses fr ON f.id = fr.form_id
      GROUP BY i.id, u.email, u.temp_id, f.id, f.form_url, f.start_time, f.end_time
      ORDER BY i.created_at DESC
    `;
    
    const result = await pool.query(query, [highThreshold, lowThreshold]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get single idea with detailed study information
export const getIdeaById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const ideaQuery = `
      SELECT 
        i.*,
        u.email as creator_email,
        u.temp_id as creator_name,
        f.id as form_id,
        f.form_url,
        f.start_time,
        f.end_time,
        COUNT(fr.id) as total_responses
      FROM ideas i
      LEFT JOIN users u ON i.user_id = u.id
      LEFT JOIN forms f ON i.id = f.idea_id
      LEFT JOIN form_responses fr ON f.id = fr.form_id
      WHERE i.id = $1
      GROUP BY i.id, u.email, u.temp_id, f.id, f.form_url, f.start_time, f.end_time
    `;
    
    const responsesQuery = `
      SELECT 
        fr.*,
        u.email as responder_email,
        u.temp_id as responder_name
      FROM form_responses fr
      LEFT JOIN users u ON fr.responder_id = u.id
      LEFT JOIN forms f ON fr.form_id = f.id
      WHERE f.idea_id = $1
      ORDER BY fr.created_at DESC
    `;
    
    const [ideaResult, responsesResult] = await Promise.all([
      pool.query(ideaQuery, [id]),
      pool.query(responsesQuery, [id])
    ]);
    
    if (ideaResult.rows.length === 0) {
      return res.status(404).json({ error: 'Idea not found' });
    }
    
    const idea = ideaResult.rows[0];
    const responses = responsesResult.rows;
    
    res.json({ ...idea, responses });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Activate idea
export const activateIdea = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'UPDATE ideas SET stage = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      ['Starting', id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Idea not found' });
    }
    
    res.json({ message: 'Idea activated successfully', idea: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Deactivate idea
export const deactivateIdea = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'UPDATE ideas SET stage = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      ['Inactive', id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Idea not found' });
    }
    
    res.json({ message: 'Idea deactivated successfully', idea: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Reset idea (clear all study data)
export const resetIdea = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    
    // Delete all form responses for this idea
    await client.query(
      'DELETE FROM form_responses WHERE form_id IN (SELECT id FROM forms WHERE idea_id = $1)',
      [id]
    );
    
    // Delete the form for this idea
    await client.query('DELETE FROM forms WHERE idea_id = $1', [id]);
    
    // Reset idea stage and clear lens data
    const result = await client.query(
      `UPDATE ideas SET 
        stage = 'Starting',
        lens_selector = NULL,
        survey_generator = NULL,
        updated_at = NOW()
      WHERE id = $1 RETURNING *`,
      [id]
    );
    
    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Idea not found' });
    }
    
    await client.query('COMMIT');
    res.json({ message: 'Idea reset successfully', idea: result.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
};

// Update idea stage
export const updateIdeaStage = async (req, res) => {
  try {
    const { id } = req.params;
    const { stage } = req.body;
    
    const validStages = ['Starting', 'In Progress', 'Completed', 'Inactive'];
    if (!validStages.includes(stage)) {
      return res.status(400).json({ error: 'Invalid stage' });
    }
    
    const result = await pool.query(
      'UPDATE ideas SET stage = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [stage, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Idea not found' });
    }
    
    res.json({ message: 'Idea stage updated successfully', idea: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get study analytics for dashboard
export const getStudyAnalytics = async (req, res) => {
  try {
    const analyticsQuery = `
      SELECT 
        COUNT(*) as total_ideas,
        COUNT(CASE WHEN i.stage = 'Starting' THEN 1 END) as starting_ideas,
        COUNT(CASE WHEN i.stage = 'In Progress' THEN 1 END) as in_progress_ideas,
        COUNT(CASE WHEN i.stage = 'Completed' THEN 1 END) as completed_ideas,
        COUNT(CASE WHEN i.stage = 'Inactive' THEN 1 END) as inactive_ideas,
        COUNT(f.id) as ideas_with_studies,
        COUNT(CASE WHEN f.start_time IS NOT NULL THEN 1 END) as active_studies,
        AVG(response_counts.response_count) as avg_responses_per_study
      FROM ideas i
      LEFT JOIN forms f ON i.id = f.idea_id
      LEFT JOIN (
        SELECT f.idea_id, COUNT(fr.id) as response_count
        FROM forms f
        LEFT JOIN form_responses fr ON f.id = fr.form_id
        GROUP BY f.idea_id
      ) response_counts ON i.id = response_counts.idea_id
    `;
    
    const result = await pool.query(analyticsQuery);
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Existing functions (keep these as they are)
export const getIdeasOverview = async (req, res) => {
  try {
    const result = await pool.query(`SELECT COUNT(*) as total_ideas FROM ideas`);
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getIdeasTrends = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT DATE(created_at) as date, COUNT(*) as ideas_submitted 
      FROM ideas 
      GROUP BY DATE(created_at) 
      ORDER BY date DESC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getIdeasValidation = async (req, res) => {
  try {
    const result = await pool.query(`SELECT COUNT(*) as total_ideas FROM ideas`);
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};