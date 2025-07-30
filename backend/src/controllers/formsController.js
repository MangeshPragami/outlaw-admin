// backend/src/controllers/formsController.js
import pool from '../models/db.js';

// ===== EXISTING FUNCTION (KEEP AS IS) =====
export const getFormsOverview = async (req, res) => {
  try {
    const result = await pool.query(`SELECT COUNT(*) as total_forms FROM forms`);
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ===== NEW SURVEY MANAGEMENT FUNCTIONS =====

// Get all surveys organized by study with response analytics
export const getAllSurveys = async (req, res) => {
  try {
    const query = `
      SELECT 
        f.*,
        i.name as idea_name,
        i.description as idea_description,
        i.targeted_audience,
        i.stage as idea_stage,
        u.email as creator_email,
        u.temp_id as creator_name,
        COUNT(fr.id) as total_responses,
        COUNT(DISTINCT fr.responder_id) as unique_responders,
        MIN(fr.created_at) as first_response_time,
        MAX(fr.created_at) as last_response_time,
        -- Calculate survey status based on dates and responses
        CASE 
          WHEN f.start_time IS NULL THEN 'Draft'
          WHEN f.start_time > NOW() THEN 'Scheduled'
          WHEN f.end_time IS NOT NULL AND f.end_time < NOW() THEN 'Completed'
          WHEN f.start_time <= NOW() THEN 'Active'
          ELSE 'Draft'
        END as survey_status,
        -- Calculate response rate (assuming target is dynamic)
        CASE 
          WHEN f.start_time IS NOT NULL THEN 
            CAST(
              (COUNT(fr.id)::float / GREATEST(
                EXTRACT(DAYS FROM (COALESCE(f.end_time, NOW()) - f.start_time)) * 2, 
                1
              )) * 100 AS DECIMAL(10,2)
            )
          ELSE 0
        END as response_rate_per_day,
        -- Calculate collection progress based on time elapsed
        CASE 
          WHEN f.start_time IS NULL OR f.end_time IS NULL THEN 0
          WHEN f.end_time <= NOW() THEN 100
          ELSE CAST(
            (EXTRACT(EPOCH FROM (NOW() - f.start_time)) / 
             EXTRACT(EPOCH FROM (f.end_time - f.start_time))) * 100 AS DECIMAL(10,2)
          )
        END as time_progress_percentage
      FROM forms f
      LEFT JOIN ideas i ON f.idea_id = i.id
      LEFT JOIN users u ON f.creator_id = u.id
      LEFT JOIN form_responses fr ON f.id = fr.form_id
      GROUP BY f.id, i.name, i.description, i.targeted_audience, i.stage, u.email, u.temp_id
      ORDER BY f.created_at DESC
    `;
    
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get detailed survey information with response analysis
export const getSurveyById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get survey details
    const surveyQuery = `
      SELECT 
        f.*,
        i.name as idea_name,
        i.description as idea_description,
        i.targeted_audience,
        u.email as creator_email,
        u.temp_id as creator_name,
        COUNT(fr.id) as total_responses,
        COUNT(DISTINCT fr.responder_id) as unique_responders
      FROM forms f
      LEFT JOIN ideas i ON f.idea_id = i.id
      LEFT JOIN users u ON f.creator_id = u.id
      LEFT JOIN form_responses fr ON f.id = fr.form_id
      WHERE f.id = $1
      GROUP BY f.id, i.name, i.description, i.targeted_audience, u.email, u.temp_id
    `;
    
    // Get response details with responder info
    const responsesQuery = `
      SELECT 
        fr.*,
        u.email as responder_email,
        u.temp_id as responder_name,
        u.persona_type as responder_type,
        EXTRACT(EPOCH FROM (fr.created_at - f.start_time))/3600 as hours_after_start
      FROM form_responses fr
      LEFT JOIN users u ON fr.responder_id = u.id
      LEFT JOIN forms f ON fr.form_id = f.id
      WHERE fr.form_id = $1
      ORDER BY fr.created_at ASC
    `;
    
    // Get response timeline for analytics
    const timelineQuery = `
      SELECT 
        DATE(fr.created_at) as response_date,
        COUNT(fr.id) as responses_count,
        COUNT(DISTINCT fr.responder_id) as unique_responders_count
      FROM form_responses fr
      WHERE fr.form_id = $1
      GROUP BY DATE(fr.created_at)
      ORDER BY response_date ASC
    `;
    
    const [surveyResult, responsesResult, timelineResult] = await Promise.all([
      pool.query(surveyQuery, [id]),
      pool.query(responsesQuery, [id]),
      pool.query(timelineQuery, [id])
    ]);
    
    if (surveyResult.rows.length === 0) {
      return res.status(404).json({ error: 'Survey not found' });
    }
    
    const survey = surveyResult.rows[0];
    const responses = responsesResult.rows;
    const timeline = timelineResult.rows;
    
    // Calculate response analytics
    const analytics = calculateResponseAnalytics(survey, responses, timeline);
    
    res.json({
      survey,
      responses,
      timeline,
      analytics
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create new survey
export const createSurvey = async (req, res) => {
  try {
    const { idea_id, form_url, start_time, end_time } = req.body;
    const creator_id = req.user.id; // Assuming auth middleware sets req.user
    
    if (!idea_id || !form_url) {
      return res.status(400).json({ error: 'Idea ID and form URL are required' });
    }
    
    // Check if survey already exists for this idea
    const existingCheck = await pool.query(
      'SELECT id FROM forms WHERE idea_id = $1',
      [idea_id]
    );
    
    if (existingCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Survey already exists for this idea' });
    }
    
    const result = await pool.query(
      `INSERT INTO forms (creator_id, idea_id, form_url, start_time, end_time, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
       RETURNING *`,
      [creator_id, idea_id, form_url, start_time, end_time]
    );
    
    res.json({ message: 'Survey created successfully', survey: result.rows[0] });
  } catch (error) {
    if (error.code === '23505') { // Unique constraint violation
      res.status(400).json({ error: 'Survey already exists for this idea' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
};

// Update survey
export const updateSurvey = async (req, res) => {
  try {
    const { id } = req.params;
    const { form_url, start_time, end_time } = req.body;
    
    const result = await pool.query(
      `UPDATE forms 
       SET form_url = COALESCE($1, form_url),
           start_time = COALESCE($2, start_time),
           end_time = COALESCE($3, end_time),
           updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [form_url, start_time, end_time, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Survey not found' });
    }
    
    res.json({ message: 'Survey updated successfully', survey: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete survey
export const deleteSurvey = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'DELETE FROM forms WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Survey not found' });
    }
    
    res.json({ message: 'Survey deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get survey analytics dashboard
export const getSurveyAnalytics = async (req, res) => {
  try {
    const analyticsQuery = `
      SELECT 
        COUNT(f.id) as total_surveys,
        COUNT(CASE WHEN f.start_time IS NOT NULL AND f.start_time <= NOW() 
                   AND (f.end_time IS NULL OR f.end_time > NOW()) THEN 1 END) as active_surveys,
        COUNT(CASE WHEN f.end_time IS NOT NULL AND f.end_time <= NOW() THEN 1 END) as completed_surveys,
        COUNT(CASE WHEN f.start_time IS NULL THEN 1 END) as draft_surveys,
        SUM(response_counts.response_count) as total_responses,
        AVG(response_counts.response_count) as avg_responses_per_survey,
        MAX(response_counts.response_count) as max_responses,
        COUNT(DISTINCT response_counts.responder_count) as total_unique_responders
      FROM forms f
      LEFT JOIN (
        SELECT 
          fr.form_id,
          COUNT(fr.id) as response_count,
          COUNT(DISTINCT fr.responder_id) as responder_count
        FROM form_responses fr
        GROUP BY fr.form_id
      ) response_counts ON f.id = response_counts.form_id
    `;
    
    // Get response trends over time
    const trendsQuery = `
      SELECT 
        DATE(fr.created_at) as date,
        COUNT(fr.id) as responses,
        COUNT(DISTINCT fr.form_id) as active_surveys,
        COUNT(DISTINCT fr.responder_id) as unique_responders
      FROM form_responses fr
      WHERE fr.created_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(fr.created_at)
      ORDER BY date ASC
    `;
    
    // Get responder type breakdown
    const responderTypesQuery = `
      SELECT 
        u.persona_type,
        COUNT(fr.id) as response_count,
        COUNT(DISTINCT fr.responder_id) as unique_responders,
        COUNT(DISTINCT fr.form_id) as surveys_participated
      FROM form_responses fr
      LEFT JOIN users u ON fr.responder_id = u.id
      WHERE u.persona_type IS NOT NULL
      GROUP BY u.persona_type
      ORDER BY response_count DESC
    `;
    
    const [analyticsResult, trendsResult, responderTypesResult] = await Promise.all([
      pool.query(analyticsQuery),
      pool.query(trendsQuery),
      pool.query(responderTypesQuery)
    ]);
    
    res.json({
      overview: analyticsResult.rows[0],
      trends: trendsResult.rows,
      responderTypes: responderTypesResult.rows
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get surveys by idea/study
export const getSurveysByIdea = async (req, res) => {
  try {
    const { ideaId } = req.params;
    
    const query = `
      SELECT 
        f.*,
        i.name as idea_name,
        COUNT(fr.id) as total_responses,
        COUNT(DISTINCT fr.responder_id) as unique_responders,
        CASE 
          WHEN f.start_time IS NULL THEN 'Draft'
          WHEN f.start_time > NOW() THEN 'Scheduled'
          WHEN f.end_time IS NOT NULL AND f.end_time < NOW() THEN 'Completed'
          WHEN f.start_time <= NOW() THEN 'Active'
          ELSE 'Draft'
        END as status
      FROM forms f
      LEFT JOIN ideas i ON f.idea_id = i.id
      LEFT JOIN form_responses fr ON f.id = fr.form_id
      WHERE f.idea_id = $1
      GROUP BY f.id, i.name
      ORDER BY f.created_at DESC
    `;
    
    const result = await pool.query(query, [ideaId]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Start survey (activate)
export const startSurvey = async (req, res) => {
  try {
    const { id } = req.params;
    const { duration_days } = req.body;
    
    const start_time = new Date();
    const end_time = duration_days ? 
      new Date(start_time.getTime() + (duration_days * 24 * 60 * 60 * 1000)) : 
      null;
    
    const result = await pool.query(
      `UPDATE forms 
       SET start_time = $1, end_time = $2, updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [start_time, end_time, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Survey not found' });
    }
    
    res.json({ message: 'Survey started successfully', survey: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Stop survey (deactivate)
export const stopSurvey = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      `UPDATE forms 
       SET end_time = NOW(), updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Survey not found' });
    }
    
    res.json({ message: 'Survey stopped successfully', survey: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Helper function to calculate response analytics
function calculateResponseAnalytics(survey, responses, timeline) {
  const now = new Date();
  const startTime = survey.start_time ? new Date(survey.start_time) : null;
  const endTime = survey.end_time ? new Date(survey.end_time) : null;
  
  // Calculate time-based metrics
  const totalDuration = startTime && endTime ? 
    (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60 * 24) : null;
  
  const elapsedDuration = startTime ? 
    (Math.min(now.getTime(), endTime?.getTime() || now.getTime()) - startTime.getTime()) / (1000 * 60 * 60 * 24) : 0;
  
  // Calculate response patterns
  const responsesByHour = responses.reduce((acc, response) => {
    if (response.hours_after_start !== null) {
      const hour = Math.floor(response.hours_after_start);
      acc[hour] = (acc[hour] || 0) + 1;
    }
    return acc;
  }, {});
  
  // Calculate responder type distribution
  const responderTypeDistribution = responses.reduce((acc, response) => {
    const type = response.responder_type || 'Unknown';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});
  
  return {
    totalDuration,
    elapsedDuration,
    responseRate: totalDuration ? (responses.length / totalDuration).toFixed(2) : 0,
    responsesByHour,
    responderTypeDistribution,
    averageResponseTime: responses.length > 0 ? 
      responses.reduce((sum, r) => sum + (r.hours_after_start || 0), 0) / responses.length : 0
  };
}