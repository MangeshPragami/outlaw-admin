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
  // ...implement user creation logic...
};

export const updateUser = async (req, res) => {
  // ...implement user update logic...
};

export const deleteUser = async (req, res) => {
  // ...implement user deletion logic...
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
