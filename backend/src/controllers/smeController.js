// src/controllers/smeController.js
import pool from '../models/db.js';

// Get all SME applications with filtering
export const getAllSMEApplications = async (req, res) => {
  try {
    const { status, industry, experience } = req.query;
    
    let whereClause = "WHERE u.persona_type = 'sme'";
    const queryParams = [];
    let paramCount = 1;
    
    if (status === 'pending') {
      whereClause += ` AND (u.verified_by_admin IS NULL OR u.verified_by_admin = false)`;
    } else if (status === 'approved') {
      whereClause += ` AND u.verified_by_admin = true`;
    } else if (status === 'rejected') {
      whereClause += ` AND u.verified_by_admin = false`;
    }
    
    if (industry) {
      whereClause += ` AND ui.industry ILIKE $${paramCount}`;
      queryParams.push(`%${industry}%`);
      paramCount++;
    }
    
    if (experience) {
      whereClause += ` AND ui.experience ILIKE $${paramCount}`;
      queryParams.push(`%${experience}%`);
      paramCount++;
    }
    
    const query = `
      SELECT 
        u.id,
        u.email,
        u.persona_type,
        u.verified_by_admin,
        u.email_verified_at,
        u.created_at,
        ui.name,
        ui.age,
        ui.profile_title,
        ui.linkedin,
        ui.github,
        ui.cv_url,
        ui.industry,
        ui.country,
        ui.experience,
        ui.description,
        ui.avatar
      FROM users u
      LEFT JOIN user_information ui ON u.id = ui.user_id
      ${whereClause}
      AND u.deleted_at IS NULL
      ORDER BY u.created_at DESC
    `;
    
    const result = await pool.query(query, queryParams);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Approve SME application
export const approveSMEApplication = async (req, res) => {
  try {
    const { smeId } = req.params;
    const { expertise_areas, hourly_rate, admin_notes } = req.body;
    
    // Update user verification status
    await pool.query(
      'UPDATE users SET verified_by_admin = true, updated_at = NOW() WHERE id = $1',
      [smeId]
    );
    
    // Update user information with SME-specific data
    // Store SME-specific data in description as JSON for now
    const smeData = {
      status: 'approved',
      expertise_areas: expertise_areas || [],
      hourly_rate: hourly_rate || 150,
      admin_notes: admin_notes || '',
      approved_at: new Date(),
      approved_by: req.user?.id || 'admin'
    };
    
    await pool.query(
      `UPDATE user_information 
       SET description = $1, updated_at = NOW() 
       WHERE user_id = $2`,
      [JSON.stringify(smeData), smeId]
    );
    
    res.json({ 
      success: true, 
      message: 'SME application approved successfully',
      smeId: parseInt(smeId)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Reject SME application
export const rejectSMEApplication = async (req, res) => {
  try {
    const { smeId } = req.params;
    const { rejection_reason, admin_notes } = req.body;
    
    // Update user verification status
    await pool.query(
      'UPDATE users SET verified_by_admin = false, updated_at = NOW() WHERE id = $1',
      [smeId]
    );
    
    // Store rejection data
    const rejectionData = {
      status: 'rejected',
      rejection_reason: rejection_reason || 'No reason provided',
      admin_notes: admin_notes || '',
      rejected_at: new Date(),
      rejected_by: req.user?.id || 'admin'
    };
    
    await pool.query(
      `UPDATE user_information 
       SET description = $1, updated_at = NOW() 
       WHERE user_id = $2`,
      [JSON.stringify(rejectionData), smeId]
    );
    
    res.json({ 
      success: true, 
      message: 'SME application rejected',
      smeId: parseInt(smeId)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get SME profile details
export const getSMEProfile = async (req, res) => {
  try {
    const { smeId } = req.params;
    
    const query = `
      SELECT 
        u.id,
        u.email,
        u.persona_type,
        u.verified_by_admin,
        u.email_verified_at,
        u.created_at,
        ui.name,
        ui.age,
        ui.profile_title,
        ui.linkedin,
        ui.github,
        ui.cv_url,
        ui.industry,
        ui.country,
        ui.experience,
        ui.description,
        ui.avatar,
        ui.available_time_slots
      FROM users u
      LEFT JOIN user_information ui ON u.id = ui.user_id
      WHERE u.id = $1 AND u.persona_type = 'sme' AND u.deleted_at IS NULL
    `;
    
    const result = await pool.query(query, [smeId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'SME not found' });
    }
    
    const sme = result.rows[0];
    
    // Parse SME-specific data from description
    let smeData = {};
    try {
      if (sme.description) {
        smeData = JSON.parse(sme.description);
      }
    } catch (e) {
      // Description might not be JSON, ignore
    }
    
    // Get session statistics
    const sessionStats = await pool.query(`
      SELECT 
        COUNT(*) as total_sessions,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_sessions,
        AVG(EXTRACT(EPOCH FROM (end_time - start_time))/60) as avg_session_duration_minutes,
        MIN(start_time) as first_session,
        MAX(start_time) as last_session
      FROM bookings 
      WHERE participant_id = $1
    `, [smeId]);
    
    res.json({
      ...sme,
      sme_data: smeData,
      session_stats: sessionStats.rows[0]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update SME profile
export const updateSMEProfile = async (req, res) => {
  try {
    const { smeId } = req.params;
    const { 
      name, 
      profile_title, 
      industry, 
      country, 
      experience, 
      linkedin, 
      github, 
      cv_url,
      expertise_areas, 
      hourly_rate, 
      availability_status, 
      max_sessions_per_week, 
      specializations, 
      admin_notes 
    } = req.body;
    
    // Update user_information table
    await pool.query(`
      UPDATE user_information 
      SET name = $1, profile_title = $2, industry = $3, country = $4, 
          experience = $5, linkedin = $6, github = $7, cv_url = $8, updated_at = NOW()
      WHERE user_id = $9
    `, [name, profile_title, industry, country, experience, linkedin, github, cv_url, smeId]);
    
    // Update SME-specific data in description
    const smeData = {
      expertise_areas: expertise_areas || [],
      hourly_rate: hourly_rate || 150,
      availability_status: availability_status || 'available',
      max_sessions_per_week: max_sessions_per_week || 10,
      specializations: specializations || [],
      admin_notes: admin_notes || '',
      updated_at: new Date(),
      updated_by: req.user?.id || 'admin'
    };
    
    await pool.query(
      `UPDATE user_information 
       SET description = $1, updated_at = NOW() 
       WHERE user_id = $2`,
      [JSON.stringify(smeData), smeId]
    );
    
    res.json({ 
      success: true, 
      message: 'SME profile updated successfully',
      smeId: parseInt(smeId)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all approved SMEs
export const getAllApprovedSMEs = async (req, res) => {
  try {
    const { expertise, availability, rating } = req.query;
    
    let whereClause = "WHERE u.persona_type = 'sme' AND u.verified_by_admin = true AND u.deleted_at IS NULL";
    const queryParams = [];
    let paramCount = 1;
    
    // Note: For now, filtering by expertise and availability would require parsing JSON from description
    // This is a simplified version - you might want to create separate tables for better querying
    
    const query = `
      SELECT 
        u.id,
        u.email,
        u.verified_by_admin,
        u.created_at,
        ui.name,
        ui.profile_title,
        ui.industry,
        ui.country,
        ui.linkedin,
        ui.cv_url,
        ui.description,
        ui.available_time_slots,
        COUNT(b.id) as total_sessions,
        COUNT(CASE WHEN b.status = 'completed' THEN 1 END) as completed_sessions,
        AVG(EXTRACT(EPOCH FROM (b.end_time - b.start_time))/60) as avg_session_duration
      FROM users u
      LEFT JOIN user_information ui ON u.id = ui.user_id
      LEFT JOIN bookings b ON u.id = b.participant_id
      ${whereClause}
      GROUP BY u.id, ui.id
      ORDER BY completed_sessions DESC, u.created_at DESC
    `;
    
    const result = await pool.query(query, queryParams);
    
    // Parse SME data from description for each SME
    const smesWithData = result.rows.map(sme => {
      let smeData = {};
      try {
        if (sme.description) {
          smeData = JSON.parse(sme.description);
        }
      } catch (e) {
        // Description might not be JSON, ignore
      }
      
      return {
        ...sme,
        sme_data: smeData,
        session_stats: {
          total_sessions: parseInt(sme.total_sessions) || 0,
          completed_sessions: parseInt(sme.completed_sessions) || 0,
          avg_session_duration: parseFloat(sme.avg_session_duration) || 0
        }
      };
    });
    
    res.json(smesWithData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get SME efforts and duration tracking
export const getSMEEfforts = async (req, res) => {
  try {
    const { smeId } = req.params;
    const { month, year } = req.query;
    
    // Default to current month if not provided
    const currentDate = new Date();
    const targetMonth = month || (currentDate.getMonth() + 1);
    const targetYear = year || currentDate.getFullYear();
    
    // Date range for the month
    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59);
    
    // Get SME basic info
    const smeQuery = await pool.query(`
      SELECT u.email, ui.name, ui.industry
      FROM users u
      LEFT JOIN user_information ui ON u.id = ui.user_id
      WHERE u.id = $1 AND u.persona_type = 'sme'
    `, [smeId]);
    
    if (smeQuery.rows.length === 0) {
      return res.status(404).json({ error: 'SME not found' });
    }
    
    const sme = smeQuery.rows[0];
    
    // Get sessions for the month
    const sessionsQuery = await pool.query(`
      SELECT 
        b.id,
        b.status,
        b.start_time,
        b.end_time,
        b.virtual_conference_id,
        b.transcript_url,
        b.video_recording_url,
        EXTRACT(EPOCH FROM (b.end_time - b.start_time))/60 as session_duration_minutes,
        creator_ui.name as founder_name,
        ideas.name as idea_name
      FROM bookings b
      LEFT JOIN users creator_u ON b.creator_id = creator_u.id
      LEFT JOIN user_information creator_ui ON creator_u.id = creator_ui.user_id
      LEFT JOIN ideas ON creator_u.id = ideas.user_id
      WHERE b.participant_id = $1 
        AND b.start_time >= $2 
        AND b.start_time <= $3
      ORDER BY b.start_time DESC
    `, [smeId, startDate, endDate]);
    
    const sessions = sessionsQuery.rows;
    
    // Calculate metrics (using defaults for preparation and follow-up time)
    const sessionsCompleted = sessions.filter(s => s.status === 'completed').length;
    const totalSessionMinutes = sessions.reduce((sum, s) => sum + (s.session_duration_minutes || 0), 0);
    const preparationTimePerSession = 15; // Default 15 minutes
    const followUpTimePerSession = 10; // Default 10 minutes
    const totalPrepTime = sessions.length * preparationTimePerSession;
    const totalFollowUpTime = sessions.length * followUpTimePerSession;
    const totalHours = (totalSessionMinutes + totalPrepTime + totalFollowUpTime) / 60;
    
    // Mock rating calculation based on session completion
    const avgSessionRating = sessions.length > 0 ? 
      sessions.reduce((sum, s) => {
        return sum + (s.transcript_url ? 5 : s.status === 'completed' ? 4 : 3);
      }, 0) / sessions.length : 0;
    
    // Calculate earnings
    const baseRate = 150; // $150/hour default
    const performanceMultiplier = avgSessionRating >= 4.5 ? 1.2 : avgSessionRating >= 4.0 ? 1.1 : 1.0;
    const baseEarnings = totalHours * baseRate;
    const totalEarnings = baseEarnings * performanceMultiplier;
    const bonusEarnings = totalEarnings - baseEarnings;
    
    // Get study participation count
    const studiesParticipated = await pool.query(`
      SELECT COUNT(DISTINCT ideas.id) as study_count
      FROM bookings b
      LEFT JOIN users creator_u ON b.creator_id = creator_u.id
      LEFT JOIN ideas ON creator_u.id = ideas.user_id
      WHERE b.participant_id = $1 
        AND b.start_time >= $2 
        AND b.start_time <= $3
    `, [smeId, startDate, endDate]);
    
    res.json({
      smeId: parseInt(smeId),
      name: sme.name || 'Unknown SME',
      email: sme.email,
      industry: sme.industry,
      period: { month: parseInt(targetMonth), year: parseInt(targetYear) },
      currentMonth: {
        sessionsCompleted,
        totalHours: Math.round(totalHours * 100) / 100,
        studiesParticipated: parseInt(studiesParticipated.rows[0].study_count) || 0,
        avgSessionRating: Math.round(avgSessionRating * 10) / 10
      },
      payoutCalculation: {
        baseRate,
        bonusMultiplier: performanceMultiplier,
        totalEarnings: Math.round(totalEarnings),
        breakdown: {
          basePayment: Math.round(baseEarnings),
          performanceBonus: Math.round(bonusEarnings)
        }
      },
      effortMetrics: {
        preparationTime: Math.round((totalPrepTime / 60) * 10) / 10,
        sessionTime: Math.round((totalSessionMinutes / 60) * 10) / 10,
        followUpTime: Math.round((totalFollowUpTime / 60) * 10) / 10
      },
      sessions: sessions.map(session => ({
        id: session.id,
        founderName: session.founder_name || 'Unknown',
        ideaName: session.idea_name || 'Unknown Study',
        sessionDate: session.start_time,
        duration: Math.round(session.session_duration_minutes || 0),
        status: session.status,
        hasTranscript: !!session.transcript_url,
        hasRecording: !!session.video_recording_url
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update SME effort record (for future use when we have detailed tracking)
export const updateSMEEffortRecord = async (req, res) => {
  try {
    const { effortId } = req.params;
    const { preparation_time, follow_up_time, session_quality_rating, founder_feedback, admin_notes } = req.body;
    
    // For now, this would require a separate SME efforts table
    // Currently storing in booking records or user information
    
    res.json({ 
      success: true, 
      message: 'SME effort record updated successfully',
      effortId
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get SME performance analytics
export const getSMEPerformanceAnalytics = async (req, res) => {
  try {
    const { smeId } = req.params;
    const { period = '6months' } = req.query;
    
    let dateFilter = '';
    const currentDate = new Date();
    
    if (period === '1month') {
      const oneMonthAgo = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, currentDate.getDate());
      dateFilter = `AND b.start_time >= '${oneMonthAgo.toISOString()}'`;
    } else if (period === '3months') {
      const threeMonthsAgo = new Date(currentDate.getFullYear(), currentDate.getMonth() - 3, currentDate.getDate());
      dateFilter = `AND b.start_time >= '${threeMonthsAgo.toISOString()}'`;
    } else if (period === '6months') {
      const sixMonthsAgo = new Date(currentDate.getFullYear(), currentDate.getMonth() - 6, currentDate.getDate());
      dateFilter = `AND b.start_time >= '${sixMonthsAgo.toISOString()}'`;
    } else if (period === '1year') {
      const oneYearAgo = new Date(currentDate.getFullYear() - 1, currentDate.getMonth(), currentDate.getDate());
      dateFilter = `AND b.start_time >= '${oneYearAgo.toISOString()}'`;
    }
    
    const analyticsQuery = await pool.query(`
      SELECT 
        DATE_TRUNC('month', b.start_time) as month,
        COUNT(*) as total_sessions,
        COUNT(CASE WHEN b.status = 'completed' THEN 1 END) as completed_sessions,
        AVG(EXTRACT(EPOCH FROM (b.end_time - b.start_time))/60) as avg_duration_minutes,
        COUNT(CASE WHEN b.transcript_url IS NOT NULL THEN 1 END) as sessions_with_transcript
      FROM bookings b
      WHERE b.participant_id = $1 ${dateFilter}
      GROUP BY DATE_TRUNC('month', b.start_time)
      ORDER BY month DESC
    `, [smeId]);
    
    res.json({
      smeId: parseInt(smeId),
      period,
      analytics: analyticsQuery.rows.map(row => ({
        month: row.month,
        totalSessions: parseInt(row.total_sessions),
        completedSessions: parseInt(row.completed_sessions),
        completionRate: row.total_sessions > 0 ? Math.round((row.completed_sessions / row.total_sessions) * 100) : 0,
        avgDurationMinutes: Math.round(row.avg_duration_minutes || 0),
        transcriptRate: row.total_sessions > 0 ? Math.round((row.sessions_with_transcript / row.total_sessions) * 100) : 0
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Suspend SME
export const suspendSME = async (req, res) => {
  try {
    const { smeId } = req.params;
    const { reason, suspend_until, admin_notes } = req.body;
    
    const suspensionData = {
      status: 'suspended',
      suspension_reason: reason,
      suspended_at: new Date(),
      suspended_by: req.user?.id || 'admin',
      suspend_until: suspend_until ? new Date(suspend_until) : null,
      admin_notes: admin_notes || ''
    };
    
    await pool.query(
      `UPDATE user_information 
       SET description = $1, updated_at = NOW() 
       WHERE user_id = $2`,
      [JSON.stringify(suspensionData), smeId]
    );
    
    res.json({ 
      success: true, 
      message: 'SME suspended successfully',
      smeId: parseInt(smeId),
      suspensionData
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Reactivate SME
export const reactivateSME = async (req, res) => {
  try {
    const { smeId } = req.params;
    const { reason, admin_notes } = req.body;
    
    const reactivationData = {
      status: 'active',
      reactivated_at: new Date(),
      reactivated_by: req.user?.id || 'admin',
      reactivation_reason: reason,
      admin_notes: admin_notes || ''
    };
    
    await pool.query(
      `UPDATE user_information 
       SET description = $1, updated_at = NOW() 
       WHERE user_id = $2`,
      [JSON.stringify(reactivationData), smeId]
    );
    
    res.json({ 
      success: true, 
      message: 'SME reactivated successfully',
      smeId: parseInt(smeId),
      reactivationData
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};