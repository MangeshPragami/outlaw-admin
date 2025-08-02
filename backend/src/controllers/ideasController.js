// src/controllers/ideasController.js
import pool from '../models/db.js';

// Get all ideas - simplified to just return all idea fields
export const getAllIdeas = async (req, res) => {
  try {
    const query = `
      SELECT 
        i.*
      FROM ideas i
      ORDER BY i.created_at DESC
    `;
    
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get single idea by ID
export const getIdeaById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT * FROM ideas WHERE id = $1
    `;
    
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Idea not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete idea
export const deleteIdea = async (req, res) => {
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
    
    // Delete the idea
    const result = await client.query(
      'DELETE FROM ideas WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Idea not found' });
    }
    
    await client.query('COMMIT');
    res.json({ message: 'Idea deleted successfully', idea: result.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
};

// Update idea status - accept any text
export const updateIdeaStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status || status.trim() === '') {
      return res.status(400).json({ error: 'Status cannot be empty' });
    }
    
    const result = await pool.query(
      'UPDATE ideas SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [status.trim(), id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Idea not found' });
    }
    
    res.json({ message: 'Idea status updated successfully', idea: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update idea stage - accept any text
export const updateIdeaStage = async (req, res) => {
  try {
    const { id } = req.params;
    const { stage } = req.body;
    
    if (!stage || stage.trim() === '') {
      return res.status(400).json({ error: 'Stage cannot be empty' });
    }
    
    const result = await pool.query(
      'UPDATE ideas SET stage = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [stage.trim(), id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Idea not found' });
    }
    
    res.json({ message: 'Idea stage updated successfully', idea: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Existing analytics functions (keep these)
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