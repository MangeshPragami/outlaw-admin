// src/controllers/smeController.js
import pool from '../models/db.js';

// SME Applications Management
export const listApplications = async (req, res) => {
  const { status = 'pending' } = req.query;
  const result = await pool.query(
    `SELECT u.*, ui.* FROM users u LEFT JOIN user_information ui ON u.id = ui.user_id WHERE u.persona_type = 'sme' AND u.application_status = $1`,
    [status]
  );
  res.json(result.rows);
};

export const getApplication = async (req, res) => {
  const { id } = req.params;
  const result = await pool.query(
    `SELECT u.*, ui.* FROM users u LEFT JOIN user_information ui ON u.id = ui.user_id WHERE u.id = $1 AND u.persona_type = 'sme'`,
    [id]
  );
  res.json(result.rows[0]);
};

export const approveApplication = async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  await pool.query(
    `UPDATE users SET application_status = 'approved', application_reason = $1, verified_by_admin = true WHERE id = $2 AND persona_type = 'sme'`,
    [reason, id]
  );
  res.json({ success: true });
};

export const rejectApplication = async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  await pool.query(
    `UPDATE users SET application_status = 'rejected', application_reason = $1, verified_by_admin = false WHERE id = $2 AND persona_type = 'sme'`,
    [reason, id]
  );
  res.json({ success: true });
};

export const bulkAction = async (req, res) => {
  const { ids, action, reason } = req.body;
  if (!['approved', 'rejected'].includes(action)) return res.status(400).json({ error: 'Invalid action' });
  await pool.query(
    `UPDATE users SET application_status = $1, application_reason = $2, verified_by_admin = $3 WHERE id = ANY($4::int[]) AND persona_type = 'sme'`,
    [action, reason, action === 'approved', ids]
  );
  res.json({ success: true });
};

// SME Profile Management
export const listProfiles = async (req, res) => {
  const result = await pool.query(
    `SELECT u.id, u.email, ui.name, ui.industry, ui.experience, ui.expertise_tags, ui.available_time_slots, ui.profile_title, u.application_status FROM users u LEFT JOIN user_information ui ON u.id = ui.user_id WHERE u.persona_type = 'sme'`
  );
  res.json(result.rows);
};

export const updateProfile = async (req, res) => {
  const { id } = req.params;
  const { name, industry, experience, expertise_tags, profile_title } = req.body;
  await pool.query(
    `UPDATE user_information SET name = $1, industry = $2, experience = $3, expertise_tags = $4, profile_title = $5 WHERE user_id = $6`,
    [name, industry, experience, expertise_tags, profile_title, id]
  );
  res.json({ success: true });
};

export const updateAvailability = async (req, res) => {
  const { id } = req.params;
  const { available_time_slots } = req.body;
  await pool.query(
    `UPDATE user_information SET available_time_slots = $1 WHERE user_id = $2`,
    [available_time_slots, id]
  );
  res.json({ success: true });
};