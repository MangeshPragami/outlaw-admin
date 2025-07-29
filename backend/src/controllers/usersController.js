// src/controllers/usersController.js
import pool from '../models/db.js';

export const getUsersOverview = async (req, res) => {
  try {
    const { period = 'all' } = req.query;
    // ...same query logic as analytics-api.js for overview...
    const result = await pool.query(`SELECT COUNT(*) as total_users FROM users`);
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getUsersGrowth = async (req, res) => {
  try {
    // ...same query logic as analytics-api.js for growth...
    const result = await pool.query(`SELECT DATE(created_at) as date, COUNT(*) as new_users FROM users GROUP BY DATE(created_at)`);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Add CRUD methods as needed
export const getAllUsers = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createUser = async (req, res) => {
  let {
    email,
    password,
    temp_id,
    auth_type,
    persona_type,
    created_at,
    updated_at,
    deleted_at,
    email_verified_at,
    verified_by_admin
  } = req.body;
  // Set valid timestamps if empty
  const now = new Date();
  created_at = created_at || now;
  updated_at = updated_at || now;
  deleted_at = deleted_at || null;
  email_verified_at = email_verified_at || null;
  try {
    const result = await pool.query(
      `INSERT INTO users (email, password, temp_id, auth_type, persona_type, created_at, updated_at, deleted_at, email_verified_at, verified_by_admin)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [email, password, temp_id, auth_type, persona_type, created_at, updated_at, deleted_at, email_verified_at, verified_by_admin]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateUser = async (req, res) => {
  const { id } = req.params;
  const {
    email,
    password,
    temp_id,
    auth_type,
    persona_type,
    created_at,
    updated_at,
    deleted_at,
    email_verified_at,
    verified_by_admin
  } = req.body;
  try {
    const result = await pool.query(
      `UPDATE users SET email = $1, password = $2, temp_id = $3, auth_type = $4, persona_type = $5, created_at = $6, updated_at = $7, deleted_at = $8, email_verified_at = $9, verified_by_admin = $10 WHERE id = $11 RETURNING *`,
      [email, password, temp_id, auth_type, persona_type, created_at, updated_at, deleted_at, email_verified_at, verified_by_admin, id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM users WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const setUserAdminVerified = async (req, res) => {
  const { id } = req.params;
  const { verified_by_admin } = req.body;
  try {
    await pool.query('UPDATE users SET verified_by_admin = $1 WHERE id = $2', [verified_by_admin, id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
