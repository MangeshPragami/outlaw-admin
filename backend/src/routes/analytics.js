// backend/src/routes/analytics.js
import express from 'express';
import pool from '../models/db.js';

const router = express.Router();

// Helper function for date ranges
const getDateFilter = (period) => {
  switch (period) {
    case 'today':
      return `created_at >= CURRENT_DATE`;
    case 'week':
      return `created_at >= CURRENT_DATE - INTERVAL '7 days'`;
    case 'month':
      return `created_at >= CURRENT_DATE - INTERVAL '30 days'`;
    default:
      return '1=1';
  }
};

// Health check endpoint
router.get('/health', async (req, res) => {
  try {
    // Test database connection
    const result = await pool.query('SELECT NOW() as current_time');
    res.json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      database: 'Connected',
      db_time: result.rows[0].current_time
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'ERROR', 
      timestamp: new Date().toISOString(),
      database: 'Disconnected',
      error: error.message
    });
  }
});

// USER ANALYTICS
router.get('/users/overview', async (req, res) => {
  try {
    const { period = 'all' } = req.query;
    const dateFilter = getDateFilter(period);
    
    const queries = await Promise.all([
      // Total users - FIXED WITH INTEGER CAST
      pool.query(`SELECT COUNT(*)::INTEGER as total_users FROM users WHERE ${dateFilter}`),
      
      // Users by persona type - FIXED WITH INTEGER CAST
      pool.query(`
        SELECT persona_type, COUNT(*)::INTEGER as count 
        FROM users 
        WHERE ${dateFilter} 
        GROUP BY persona_type
      `),
      
      // Email verification rate - FIXED
      pool.query(`
        SELECT 
          COUNT(*)::INTEGER as total_users,
          COUNT(email_verified_at)::INTEGER as verified_users,
          CAST((COUNT(email_verified_at)::numeric / NULLIF(COUNT(*), 0) * 100) AS DECIMAL(5,2)) as verification_rate
        FROM users WHERE ${dateFilter}
      `)
    ]);

    res.json({
      totalUsers: queries[0].rows[0],
      byPersonaType: queries[1].rows,
      verification: queries[2].rows[0]
    });
  } catch (error) {
    console.error('Error in /users/overview:', error.message);
    res.status(500).json({ error: error.message });
  }
});

router.get('/users/growth', async (req, res) => {
  try {
    const { period = '30' } = req.query;
    
    const query = `
      SELECT 
        DATE(created_at) as date,
        COUNT(*)::INTEGER as new_users,
        SUM(COUNT(*)::INTEGER) OVER (ORDER BY DATE(created_at)) as cumulative_users
      FROM users 
      WHERE created_at >= NOW() - INTERVAL '${period} days'
      GROUP BY DATE(created_at)
      ORDER BY DATE(created_at)
    `;
    
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Error in /users/growth:', error.message);
    res.status(500).json({ error: error.message });
  }
});

router.get('/users/demographics', async (req, res) => {
  try {
    const queries = await Promise.all([
      // Geographic distribution - FIXED WITH INTEGER CASTS
      pool.query(`
        SELECT 
          ui.country,
          COUNT(*)::INTEGER as count,
          COUNT(CASE WHEN u.persona_type = 'founder' THEN 1 END)::INTEGER as founders,
          COUNT(CASE WHEN u.persona_type = 'sme' THEN 1 END)::INTEGER as smes,
          COUNT(CASE WHEN u.persona_type = 'respondent' THEN 1 END)::INTEGER as respondents
        FROM users u
        JOIN user_information ui ON u.id = ui.user_id
        WHERE ui.country IS NOT NULL
        GROUP BY ui.country
        ORDER BY count DESC
        LIMIT 15
      `),
      
      // Industry distribution - FIXED WITH INTEGER CASTS
      pool.query(`
        SELECT 
          ui.industry,
          COUNT(*)::INTEGER as count,
          COUNT(CASE WHEN u.persona_type = 'founder' THEN 1 END)::INTEGER as founders,
          COUNT(CASE WHEN u.persona_type = 'sme' THEN 1 END)::INTEGER as smes
        FROM users u
        JOIN user_information ui ON u.id = ui.user_id
        WHERE ui.industry IS NOT NULL
        GROUP BY ui.industry
        ORDER BY count DESC
      `),
      
      // Profile completion stats - FIXED WITH INTEGER CASTS
      pool.query(`
        SELECT 
          COUNT(*)::INTEGER as total_profiles,
          COUNT(CASE WHEN name IS NOT NULL THEN 1 END)::INTEGER as with_name,
          COUNT(CASE WHEN industry IS NOT NULL THEN 1 END)::INTEGER as with_industry,
          COUNT(CASE WHEN country IS NOT NULL THEN 1 END)::INTEGER as with_country,
          COUNT(CASE WHEN linkedin IS NOT NULL THEN 1 END)::INTEGER as with_linkedin,
          COUNT(CASE WHEN cv_url IS NOT NULL THEN 1 END)::INTEGER as with_cv,
          CAST((COUNT(CASE WHEN name IS NOT NULL AND industry IS NOT NULL AND country IS NOT NULL THEN 1 END)::float / NULLIF(COUNT(*), 0) * 100) AS DECIMAL(5,2)) as completion_rate
        FROM user_information
      `)
    ]);

    res.json({
      byCountry: queries[0].rows,
      byIndustry: queries[1].rows,
      profileCompletion: queries[2].rows[0]
    });
  } catch (error) {
    console.error('Error in /users/demographics:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// IDEAS ANALYTICS
router.get('/ideas/overview', async (req, res) => {
  try {
    const { period = 'all' } = req.query;
    const dateFilter = getDateFilter(period);
    
    const queries = await Promise.all([
      // Total ideas - FIXED WITH INTEGER CAST
      pool.query(`SELECT COUNT(*)::INTEGER as total_ideas FROM ideas WHERE ${dateFilter}`),
      
      // Ideas by stage - FIXED WITH INTEGER CAST
      pool.query(`
        SELECT stage, COUNT(*)::INTEGER as count 
        FROM ideas 
        WHERE ${dateFilter}
        GROUP BY stage
      `),
      
      // Ideas with attachments - FIXED WITH INTEGER CASTS
      pool.query(`
        SELECT 
          COUNT(*)::INTEGER as total_ideas,
          COUNT(CASE WHEN pitch_deck IS NOT NULL THEN 1 END)::INTEGER as with_pitch_deck,
          COUNT(CASE WHEN voice_note IS NOT NULL THEN 1 END)::INTEGER as with_voice_note
        FROM ideas WHERE ${dateFilter}
      `)
    ]);

    res.json({
      total: queries[0].rows[0],
      byStage: queries[1].rows,
      attachments: queries[2].rows[0]
    });
  } catch (error) {
    console.error('Error in /ideas/overview:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// FORMS ANALYTICS
router.get('/forms/overview', async (req, res) => {
  try {
    const { period = 'all' } = req.query;
    const dateFilter = getDateFilter(period);

    const queries = await Promise.all([
      // Form stats - FIXED WITH INTEGER CASTS
      pool.query(`
        SELECT 
          COUNT(*)::INTEGER AS total_forms,
          COUNT(CASE WHEN form_url IS NOT NULL THEN 1 END)::INTEGER AS forms_with_url
        FROM forms
        WHERE ${dateFilter}
      `),

      // Total responses - FIXED WITH INTEGER CAST
      pool.query(`
        SELECT COUNT(*)::INTEGER AS total_responses
        FROM form_responses
        WHERE ${dateFilter}
      `),

      // Form completion rate - FIXED WITH INTEGER CASTS
      pool.query(`
        SELECT 
        COUNT(DISTINCT f.id)::INTEGER AS total_forms,
        COUNT(DISTINCT fr.form_id)::INTEGER AS forms_with_responses,
        CAST((COUNT(DISTINCT fr.form_id)::numeric / NULLIF(COUNT(DISTINCT f.id)::numeric, 0) * 100) AS DECIMAL(5,2)) AS completion_rate
        FROM forms f
        LEFT JOIN form_responses fr ON f.id = fr.form_id
        WHERE ${dateFilter.replace('created_at', 'f.created_at')}
      `)
    ]);

    res.json({
      forms: queries[0].rows[0],
      totalResponses: queries[1].rows[0],
      completion: queries[2].rows[0]
    });
  } catch (error) {
    console.error('Error in /forms/overview:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// SME ANALYTICS
router.get('/sme/overview', async (req, res) => {
  try {
    const { period = 'all' } = req.query;
    const dateFilter = getDateFilter(period);
    
    const queries = await Promise.all([
      // SME basic metrics - FIXED WITH INTEGER CASTS
      pool.query(`
        SELECT 
          COUNT(CASE WHEN u.persona_type = 'sme' THEN 1 END)::INTEGER as total_smes,
          COUNT(CASE WHEN u.persona_type = 'sme' AND u.email_verified_at IS NOT NULL THEN 1 END)::INTEGER as verified_smes,
          COUNT(DISTINCT fr.responder_id)::INTEGER as responding_smes
        FROM users u
        LEFT JOIN form_responses fr ON u.id = fr.responder_id AND u.persona_type = 'sme'
        WHERE ${dateFilter.replace('created_at', 'u.created_at')}
      `),
      
      // SME by industry - FIXED WITH INTEGER CAST
      pool.query(`
        SELECT 
          ui.industry,
          COUNT(*)::INTEGER as sme_count
        FROM users u
        JOIN user_information ui ON u.id = ui.user_id
        WHERE u.persona_type = 'sme' AND ui.industry IS NOT NULL
        GROUP BY ui.industry
        ORDER BY sme_count DESC
        LIMIT 10
      `)
    ]);

    res.json({
      overview: queries[0].rows[0],
      byIndustry: queries[1].rows
    });
  } catch (error) {
    console.error('Error in /sme/overview:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// BOOKINGS/SESSIONS ANALYTICS
router.get('/bookings/overview', async (req, res) => {
  try {
    const { period = 'all' } = req.query;
    const dateFilter = period === 'all' ? '1=1' : `start_time >= CURRENT_DATE - INTERVAL '${period === 'week' ? '7' : period === 'month' ? '30' : '90'} days'`;
    
    const queries = await Promise.all([
      // Booking stats - FIXED WITH INTEGER CASTS
      pool.query(`
        SELECT 
          COUNT(*)::INTEGER as total_bookings,
          COUNT(CASE WHEN status = 'confirmed' THEN 1 END)::INTEGER as confirmed,
          COUNT(CASE WHEN status = 'completed' THEN 1 END)::INTEGER as completed,
          COUNT(CASE WHEN status = 'cancelled' THEN 1 END)::INTEGER as cancelled
        FROM bookings WHERE ${dateFilter}
      `),
      
      // Average session duration
      pool.query(`
        SELECT 
          AVG(EXTRACT(EPOCH FROM (end_time - start_time))/60) as avg_duration_minutes,
          COUNT(*)::INTEGER as completed_sessions
        FROM bookings 
        WHERE end_time IS NOT NULL AND start_time IS NOT NULL AND ${dateFilter}
      `)
    ]);

    res.json({
      overview: queries[0].rows[0],
      duration: queries[1].rows[0]
    });
  } catch (error) {
    console.error('Error in /bookings/overview:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// CHIME/VIDEO CONFERENCING ANALYTICS
router.get('/chime/overview', async (req, res) => {
  try {
    const { period = 'all' } = req.query;
    const dateFilter = period === 'all' ? '1=1' : `start_time >= CURRENT_DATE - INTERVAL '${period === 'week' ? '7' : period === 'month' ? '30' : '90'} days'`;
    
    const queries = await Promise.all([
      // Session overview - FIXED WITH INTEGER CASTS
      pool.query(`
        SELECT 
          COUNT(*)::INTEGER as total_sessions,
          COUNT(CASE WHEN status = 'completed' THEN 1 END)::INTEGER as completed_sessions,
          COUNT(CASE WHEN transcript_url IS NOT NULL THEN 1 END)::INTEGER as sessions_with_transcripts,
          COUNT(CASE WHEN video_recording_url IS NOT NULL THEN 1 END)::INTEGER as sessions_with_recordings,
          COUNT(CASE WHEN virtual_conference_id IS NOT NULL THEN 1 END)::INTEGER as chime_sessions,
          CAST((COUNT(CASE WHEN status = 'completed' THEN 1 END)::float / NULLIF(COUNT(*), 0) * 100) AS DECIMAL(5,2)) as completion_rate
        FROM bookings 
        WHERE ${dateFilter}
      `),
      
      // Session duration analytics
      pool.query(`
        SELECT 
          AVG(EXTRACT(EPOCH FROM (end_time - start_time))/60) as avg_duration_minutes,
          MIN(EXTRACT(EPOCH FROM (end_time - start_time))/60) as min_duration_minutes,
          MAX(EXTRACT(EPOCH FROM (end_time - start_time))/60) as max_duration_minutes,
          PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (end_time - start_time))/60) as median_duration_minutes,
          COUNT(*)::INTEGER as sessions_with_duration
        FROM bookings 
        WHERE end_time IS NOT NULL AND start_time IS NOT NULL AND ${dateFilter}
      `)
    ]);

    res.json({
      sessionOverview: queries[0].rows[0],
      durationStats: queries[1].rows[0]
    });
  } catch (error) {
    console.error('Error in /chime/overview:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// CHIME TRANSCRIPT ANALYTICS
router.get('/chime/transcripts', async (req, res) => {
  try {
    const { period = '30' } = req.query;
    
    const queries = await Promise.all([
      // Transcript summary - FIXED WITH INTEGER CASTS
      pool.query(`
        SELECT 
          COUNT(CASE WHEN transcript_url IS NOT NULL THEN 1 END)::INTEGER as sessions_with_transcripts,
          COUNT(*)::INTEGER as total_completed_sessions,
          CAST((COUNT(CASE WHEN transcript_url IS NOT NULL THEN 1 END)::float / NULLIF(COUNT(*), 0) * 100) AS DECIMAL(5,2)) as transcript_coverage_rate
        FROM bookings 
        WHERE status = 'completed' 
          AND start_time >= CURRENT_DATE - INTERVAL '${period} days'
      `),
      
      // Recent sessions with transcript status
      pool.query(`
        SELECT 
          b.id as booking_id,
          b.virtual_conference_id,
          b.start_time,
          b.end_time,
          EXTRACT(EPOCH FROM (b.end_time - b.start_time))/60 as duration_minutes,
          b.status,
          CASE WHEN b.transcript_url IS NOT NULL THEN 'Available' ELSE 'Missing' END as transcript_status,
          CASE WHEN b.video_recording_url IS NOT NULL THEN 'Available' ELSE 'Missing' END as recording_status,
          creator.email as creator_email,
          participant.email as participant_email,
          ui_creator.name as creator_name,
          ui_participant.name as participant_name
        FROM bookings b
        LEFT JOIN users creator ON b.creator_id = creator.id
        LEFT JOIN users participant ON b.participant_id = participant.id
        LEFT JOIN user_information ui_creator ON creator.id = ui_creator.user_id
        LEFT JOIN user_information ui_participant ON participant.id = ui_participant.user_id
        WHERE b.start_time >= CURRENT_DATE - INTERVAL '${period} days'
        ORDER BY b.start_time DESC
        LIMIT 50
      `),
      
      // Transcript processing success rate by day - FIXED WITH INTEGER CASTS
      pool.query(`
        SELECT 
          DATE(start_time) as session_date,
          COUNT(*)::INTEGER as total_sessions,
          COUNT(CASE WHEN transcript_url IS NOT NULL THEN 1 END)::INTEGER as transcripts_generated,
          COUNT(CASE WHEN video_recording_url IS NOT NULL THEN 1 END)::INTEGER as recordings_available,
          CAST((COUNT(CASE WHEN transcript_url IS NOT NULL THEN 1 END)::float / NULLIF(COUNT(*), 0) * 100) AS DECIMAL(5,2)) as transcript_success_rate
        FROM bookings 
        WHERE status = 'completed' 
          AND start_time >= CURRENT_DATE - INTERVAL '${period} days'
        GROUP BY DATE(start_time)
        ORDER BY session_date DESC
      `)
    ]);

    res.json({
      transcriptSummary: queries[0].rows[0],
      recentSessions: queries[1].rows,
      dailySuccessRates: queries[2].rows
    });
  } catch (error) {
    console.error('Error in /chime/transcripts:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ENGAGEMENT ANALYTICS
router.get('/engagement/funnel', async (req, res) => {
  try {
    const query = `
      SELECT 
        COUNT(DISTINCT u.id)::INTEGER as total_users,
        COUNT(DISTINCT ui.user_id)::INTEGER as users_with_profiles,
        COUNT(DISTINCT i.user_id)::INTEGER as users_with_ideas,
        COUNT(DISTINCT f.creator_id)::INTEGER as users_with_forms,
        COUNT(DISTINCT fr.responder_id)::INTEGER as users_with_responses
      FROM users u
      LEFT JOIN user_information ui ON u.id = ui.user_id
      LEFT JOIN ideas i ON u.id = i.user_id
      LEFT JOIN forms f ON u.id = f.creator_id
      LEFT JOIN form_responses fr ON u.id = fr.responder_id
    `;
    
    const result = await pool.query(query);
    res.json({
      userJourney: result.rows[0]
    });
  } catch (error) {
    console.error('Error in /engagement/funnel:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// REALTIME ANALYTICS
router.get('/realtime', async (req, res) => {
  try {
    const queries = await Promise.all([
      // Today's activity - FIXED WITH INTEGER CASTS
      pool.query(`
        SELECT 
          (SELECT COUNT(*)::INTEGER FROM users WHERE DATE(created_at) = CURRENT_DATE) as new_users_today,
          (SELECT COUNT(*)::INTEGER FROM ideas WHERE DATE(created_at) = CURRENT_DATE) as new_ideas_today,
          (SELECT COUNT(*)::INTEGER FROM form_responses WHERE DATE(created_at) = CURRENT_DATE) as new_responses_today
      `),
      
      // Recent activity
      pool.query(`
        (SELECT 'user' as type, created_at, email as description FROM users ORDER BY created_at DESC LIMIT 5)
        UNION ALL
        (SELECT 'idea' as type, created_at, name as description FROM ideas ORDER BY created_at DESC LIMIT 5)
        ORDER BY created_at DESC
        LIMIT 10
      `)
    ]);

    res.json({
      today: queries[0].rows[0],
      recentActivity: queries[1].rows
    });
  } catch (error) {
    console.error('Error in /realtime:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ERROR HANDLING MIDDLEWARE
router.use((error, req, res, next) => {
  console.error('Analytics API Error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: error.message,
    timestamp: new Date().toISOString()
  });
});

export default router;