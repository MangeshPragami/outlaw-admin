// src/controllers/bookingsController.js
import pool from '../models/db.js';

export const getBookingsOverview = async (req, res) => {
  try {
    const { period = 'all' } = req.query;
    
    let dateFilter = '';
    if (period !== 'all') {
      const now = new Date();
      let startDate;
      
      switch (period) {
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }
      
      dateFilter = `WHERE created_at >= '${startDate.toISOString()}'`;
    }
    
    const result = await pool.query(`SELECT COUNT(*) as total_bookings FROM bookings ${dateFilter}`);
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getBookingsGrowth = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT DATE(created_at) as date, COUNT(*) as new_bookings 
      FROM bookings 
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(created_at) 
      ORDER BY date DESC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAllBookings = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        b.*,
        u1.email as creator_email,
        u2.email as participant_email
      FROM bookings b
      LEFT JOIN users u1 ON b.creator_id = u1.id
      LEFT JOIN users u2 ON b.participant_id = u2.id
      ORDER BY b.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getBookingById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT 
        b.*,
        u1.email as creator_email,
        u2.email as participant_email
      FROM bookings b
      LEFT JOIN users u1 ON b.creator_id = u1.id
      LEFT JOIN users u2 ON b.participant_id = u2.id
      WHERE b.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createBooking = async (req, res) => {
  let {
    status,
    creator_id,
    participant_id,
    start_time,
    end_time,
    virtual_conference_id,
    transcript_url,
    video_recording_url
  } = req.body;

  // Set default values and timestamps
  const now = new Date();
  status = status || 'scheduled';

  try {
    const result = await pool.query(
      `INSERT INTO bookings (
        status, creator_id, participant_id, start_time, end_time, 
        virtual_conference_id, transcript_url, video_recording_url, 
        created_at, updated_at
      )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
       RETURNING *`,
      [
        status, creator_id, participant_id, start_time, end_time,
        virtual_conference_id, transcript_url, video_recording_url,
        now, now
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateBooking = async (req, res) => {
  const { id } = req.params;
  const {
    status,
    creator_id,
    participant_id,
    start_time,
    end_time,
    virtual_conference_id,
    transcript_url,
    video_recording_url
  } = req.body;

  const updated_at = new Date();

  try {
    const result = await pool.query(
      `UPDATE bookings SET 
        status = $1, creator_id = $2, participant_id = $3, start_time = $4, 
        end_time = $5, virtual_conference_id = $6, transcript_url = $7, 
        video_recording_url = $8, updated_at = $9
       WHERE id = $10 
       RETURNING *`,
      [
        status, creator_id, participant_id, start_time, end_time,
        virtual_conference_id, transcript_url, video_recording_url,
        updated_at, id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteBooking = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM bookings WHERE id = $1 RETURNING id', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    res.json({ success: true, message: 'Booking deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateBookingStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const updated_at = new Date();

  try {
    const result = await pool.query(
      'UPDATE bookings SET status = $1, updated_at = $2 WHERE id = $3 RETURNING *',
      [status, updated_at, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getBookingsByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const result = await pool.query(`
      SELECT 
        b.*,
        u1.email as creator_email,
        u2.email as participant_email
      FROM bookings b
      LEFT JOIN users u1 ON b.creator_id = u1.id
      LEFT JOIN users u2 ON b.participant_id = u2.id
      WHERE b.status = $1
      ORDER BY b.created_at DESC
    `, [status]);
    
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getUpcomingBookings = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        b.*,
        u1.email as creator_email,
        u2.email as participant_email
      FROM bookings b
      LEFT JOIN users u1 ON b.creator_id = u1.id
      LEFT JOIN users u2 ON b.participant_id = u2.id
      WHERE b.start_time > NOW() AND b.status != 'cancelled'
      ORDER BY b.start_time ASC
    `);
    
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};