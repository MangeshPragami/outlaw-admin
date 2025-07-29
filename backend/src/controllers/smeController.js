// src/controllers/smeController.js
import pool from '../models/db.js';

export const getSMEOverview = async (req, res) => {
  try {
    // ...same query logic as analytics-api.js for SME overview...
    const result = await pool.query(`SELECT COUNT(*) as total_smes FROM users WHERE persona_type = 'sme'`);
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getSMEExpertise = async (req, res) => {
  try {
    // ...same query logic as analytics-api.js for SME expertise...
    const result = await pool.query(`SELECT industry, COUNT(*) as sme_count FROM user_information WHERE industry IS NOT NULL GROUP BY industry`);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getSMEPerformance = async (req, res) => {
  try {
    // ...same query logic as analytics-api.js for SME performance...
    const result = await pool.query(`SELECT COUNT(*) as total_smes FROM users WHERE persona_type = 'sme'`);
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
