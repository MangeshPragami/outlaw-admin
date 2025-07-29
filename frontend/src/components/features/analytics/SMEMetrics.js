// frontend/src/components/SMEMetrics.js
import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, RadialBarChart, RadialBar } from 'recharts';

const SMEMetrics = () => {
  const [period, setPeriod] = useState('30');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    overview: {},
    expertise: {},
    performance: {}
  });

  useEffect(() => {
    fetchSMEData();
    const interval = setInterval(fetchSMEData, 30000); // Auto-refresh every 30 seconds
    return () => clearInterval(interval);
  }, [period]);

  const fetchSMEData = async () => {
    setLoading(true);
    try {
      const [overviewRes, expertiseRes, performanceRes] = await Promise.all([
        fetch(`/api/analytics/sme/overview?period=${period}`),
        fetch('/api/analytics/sme/expertise'),
        fetch(`/api/analytics/sme/performance?period=${period}`)
      ]);

      const overview = await overviewRes.json();
      const expertise = await expertiseRes.json();
      const performance = await performanceRes.json();

      setData({ overview, expertise, performance });
    } catch (error) {
      console.error('Error fetching SME data:', error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

  // Calculate readiness percentage
  const readinessData = data.overview.readiness ? [
    {
      name: 'Profile Complete',
      value: Math.round((data.overview.readiness.profile_complete / data.overview.readiness.total_smes) * 100),
      fill: '#10B981'
    },
    {
      name: 'With LinkedIn',
      value: Math.round((data.overview.readiness.with_linkedin / data.overview.readiness.total_smes) * 100),
      fill: '#3B82F6'
    },
    {
      name: 'With CV',
      value: Math.round((data.overview.readiness.with_cv / data.overview.readiness.total_smes) * 100),
      fill: '#F59E0B'
    }
  ] : [];

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading SME Analytics...</p>
      </div>
    );
  }

  return (
    <div className="analytics-page">
      {/* Page Header */}
      <div className="page-header">
        <div className="header-left">
          <h1> SME Analytics</h1>
          <p>Subject Matter Expert engagement and performance insights</p>
          <span className="last-updated">Last updated: {new Date().toLocaleTimeString()}</span>
        </div>
        <div className="header-controls">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="period-selector"
          >
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="90">Last 90 Days</option>
            <option value="all">All Time</option>
          </select>
          <button onClick={fetchSMEData} className="refresh-btn">
             Refresh
          </button>
        </div>
      </div>

      {/* SME Overview Metrics */}
      <div className="metrics-grid">
        <div className="metric-card">
          <h3> SME Overview</h3>
          <div className="metric-items">
            <div className="metric-item">
              
              <div className="metric-details">
                <span className="metric-value">{data.overview.overview?.total_smes || 0}</span>
                <span className="metric-label">Total SMEs</span>
              </div>
            </div>
            <div className="metric-item">
              
              <div className="metric-details">
                <span className="metric-value">{data.overview.overview?.verified_smes || 0}</span>
                <span className="metric-label">Verified SMEs</span>
              </div>
            </div>
            <div className="metric-item">
              
              <div className="metric-details">
                <span className="metric-value">{data.overview.overview?.active_smes || 0}</span>
                <span className="metric-label">Active SMEs</span>
              </div>
            </div>
            <div className="metric-item">
              
              <div className="metric-details">
                <span className="metric-value">{data.overview.overview?.responding_smes || 0}</span>
                <span className="metric-label">Responding SMEs</span>
              </div>
            </div>
          </div>
        </div>

        {/* SME Readiness Radial Chart */}
        <div className="metric-card">
          <h3> SME Readiness Levels</h3>
          <ResponsiveContainer width="100%" height={250}>
            <RadialBarChart cx="50%" cy="50%" innerRadius="10%" outerRadius="80%" data={readinessData}>
              <RadialBar
                minAngle={15}
                label={{ position: 'insideStart', fill: '#fff' }}
                background
                clockWise={true}
                dataKey="value"
              />
              <Tooltip formatter={(value) => [`${value}%`, 'Completion Rate']} />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="readiness-stats">
            {readinessData.map((item, index) => (
              <div key={item.name} className="readiness-stat">
                <div className="stat-color" style={{ backgroundColor: item.fill }}></div>
                <span className="stat-label">{item.name}</span>
                <span className="stat-value">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* SME Engagement Status */}
        <div className="metric-card">
          <h3> SME Engagement Status</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={data.overview.engagementStatus || []}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="sme_count"
              >
                {(data.overview.engagementStatus || []).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="engagement-legend">
            {(data.overview.engagementStatus || []).map((status, index) => (
              <div key={index} className="legend-item">
                <div className="legend-color" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                <span className="legend-label">{status.engagement_status}</span>
                <span className="legend-value">{status.sme_count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SME Registration Trends */}
      <div className="metrics-grid">
        <div className="metric-card large">
          <h3> SME Registration Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.performance.registrationTrends || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="new_smes"
                stroke="#3B82F6"
                strokeWidth={3}
                dot={{ r: 6 }}
                name="New SMEs"
              />
              <Line
                type="monotone"
                dataKey="total_registrations"
                stroke="#10B981"
                strokeWidth={2}
                dot={{ r: 4 }}
                name="Total Registrations"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* SME Utilization Metrics */}
        <div className="metric-card">
          <h3>⚡ SME Utilization</h3>
          <div className="utilization-metrics">
            {(data.performance.utilizationMetrics || []).map((metric, index) => (
              <div key={index} className="utilization-item">
                <div className="metric-name">{metric.metric}</div>
                <div className="metric-value-large">{metric.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SME Expertise Distribution */}
      <div className="metrics-grid">
        <div className="metric-card">
          <h3> SME Industry Expertise</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data.expertise.byIndustry || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="industry" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="sme_count" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="metric-card">
          <h3> SME Geographic Distribution</h3>
          <div className="geography-list">
            {(data.expertise.byCountry || []).map((country, index) => (
              <div key={index} className="geography-item">
                <span className="country-name">{country.country}</span>
                <div className="country-stats">
                  <span className="sme-count">{country.sme_count} SMEs</span>
                  <span className="linkedin-count">{country.with_linkedin} with LinkedIn</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Performing SMEs */}
      <div className="metric-card large">
        <h3> Top Performing SMEs</h3>
        <div className="smes-table">
          <div className="table-header">
            <span>SME</span>
            <span>Industry</span>
            <span>Responses Given</span>
            <span>Forms Responded</span>
            <span>First Response</span>
            <span>Latest Response</span>
          </div>
          {(data.performance.topPerformers || []).map((sme, index) => (
            <div key={sme.sme_id} className="table-row">
              <span className="sme-name">
                <div className="sme-avatar">{index + 1}</div>
                {sme.name || 'Anonymous'}
              </span>
              <span className="sme-industry">{sme.industry || 'Not specified'}</span>
              <span className="sme-responses">{sme.responses_given}</span>
              <span className="sme-forms">{sme.unique_forms_responded}</span>
              <span className="sme-first">
                {sme.first_response_date ? new Date(sme.first_response_date).toLocaleDateString() : '-'}
              </span>
              <span className="sme-latest">
                {sme.last_response_date ? new Date(sme.last_response_date).toLocaleDateString() : '-'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* SME Profile Details */}
      <div className="metric-card large">
        <h3>👤 SME Profile Completion Details</h3>
        <div className="profiles-table">
          <div className="table-header">
            <span>Name</span>
            <span>Industry</span>
            <span>Title</span>
            <span>Country</span>
            <span>LinkedIn</span>
            <span>CV</span>
            <span>Email Verified</span>
            <span>Joined</span>
          </div>
          {(data.expertise.profiles || []).map((profile, index) => (
            <div key={index} className="table-row">
              <span className="profile-name">{profile.name || 'Not provided'}</span>
              <span className="profile-industry">{profile.industry || 'Not specified'}</span>
              <span className="profile-title">{profile.profile_title || 'Not provided'}</span>
              <span className="profile-country">{profile.country || 'Not specified'}</span>
              <span className={`profile-linkedin ${profile.has_linkedin === 'Yes' ? 'has-value' : 'no-value'}`}>
                {profile.has_linkedin}
              </span>
              <span className={`profile-cv ${profile.has_cv === 'Yes' ? 'has-value' : 'no-value'}`}>
                {profile.has_cv}
              </span>
              <span className={`profile-verified ${profile.email_verified ? 'verified' : 'not-verified'}`}>
                {profile.email_verified ? 'Yes' : 'No'}
              </span>
              <span className="profile-joined">
                {new Date(profile.created_at).toLocaleDateString()}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* SME Readiness Breakdown */}
      <div className="metric-card">
        <h3> SME Readiness Breakdown</h3>
        <div className="readiness-breakdown">
          <div className="readiness-item">
            <div className="readiness-label">Total SMEs</div>
            <div className="readiness-value">{data.overview.readiness?.total_smes || 0}</div>
            <div className="readiness-bar">
              <div className="readiness-fill" style={{ width: '100%', backgroundColor: '#E5E7EB' }}></div>
            </div>
          </div>
          <div className="readiness-item">
            <div className="readiness-label">Profile Complete</div>
            <div className="readiness-value">{data.overview.readiness?.profile_complete || 0}</div>
            <div className="readiness-bar">
              <div 
                className="readiness-fill" 
                style={{ 
                  width: `${((data.overview.readiness?.profile_complete || 0) / (data.overview.readiness?.total_smes || 1)) * 100}%`,
                  backgroundColor: '#10B981'
                }}
              ></div>
            </div>
          </div>
          <div className="readiness-item">
            <div className="readiness-label">With LinkedIn</div>
            <div className="readiness-value">{data.overview.readiness?.with_linkedin || 0}</div>
            <div className="readiness-bar">
              <div 
                className="readiness-fill" 
                style={{ 
                  width: `${((data.overview.readiness?.with_linkedin || 0) / (data.overview.readiness?.total_smes || 1)) * 100}%`,
                  backgroundColor: '#3B82F6'
                }}
              ></div>
            </div>
          </div>
          <div className="readiness-item">
            <div className="readiness-label">With CV</div>
            <div className="readiness-value">{data.overview.readiness?.with_cv || 0}</div>
            <div className="readiness-bar">
              <div 
                className="readiness-fill" 
                style={{ 
                  width: `${((data.overview.readiness?.with_cv || 0) / (data.overview.readiness?.total_smes || 1)) * 100}%`,
                  backgroundColor: '#F59E0B'
                }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SMEMetrics;