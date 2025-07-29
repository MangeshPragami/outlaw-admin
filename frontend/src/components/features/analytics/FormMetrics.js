// FormMetrics.js
import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const FormMetrics = () => {
  const [period, setPeriod] = useState('30');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    overview: {}
  });

  useEffect(() => {
    fetchFormData();
    const interval = setInterval(fetchFormData, 30000);
    return () => clearInterval(interval);
  }, [period]);

  const fetchFormData = async () => {
    setLoading(true);
    try {
      const overviewRes = await fetch(`/api/analytics/forms/overview?period=${period}`);
      const overview = await overviewRes.json();
      setData({ overview });
    } catch (error) {
      console.error('Error fetching form data:', error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading Form Analytics...</p>
      </div>
    );
  }

  return (
    <div className="analytics-page">
      <div className="page-header">
        <div className="header-left">
          <h1>Form Analytics</h1>
          <p>Survey creation and response performance insights</p>
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
          <button onClick={fetchFormData} className="refresh-btn">
            Refresh
          </button>
        </div>
      </div>

      <div className="metrics-grid">
        <div className="metric-card">
          <h3>Form Overview</h3>
          <div className="metric-items">
            <div className="metric-item">
              
              <div className="metric-details">
                <span className="metric-value">{data.overview.forms?.total_forms || 0}</span>
                <span className="metric-label">Total Forms</span>
              </div>
            </div>
            <div className="metric-item">
              
              <div className="metric-details">
                <span className="metric-value">{data.overview.forms?.forms_with_url || 0}</span>
                <span className="metric-label">Published Forms</span>
              </div>
            </div>
            <div className="metric-item">
              
              <div className="metric-details">
                <span className="metric-value">{data.overview.completion?.completion_rate || 0}%</span>
                <span className="metric-label">Completion Rate</span>
              </div>
            </div>
            <div className="metric-item">
              
              <div className="metric-details">
                <span className="metric-value">{data.overview.totalResponses?.total_responses || 0}</span>
                <span className="metric-label">Total Responses</span>
              </div>
            </div>
          </div>
        </div>

        <div className="metric-card">
          <h3>Form Performance Metrics</h3>
          <div className="success-metrics">
            <div className="success-item">
              <div className="success-label">Forms with Responses</div>
              <div className="success-value">
                {data.overview.completion?.forms_with_responses || 0}
              </div>
              <div className="success-description">
                out of {data.overview.completion?.total_forms || 0} total forms
              </div>
            </div>
            <div className="success-item">
              <div className="success-label">Average Responses per Form</div>
              <div className="success-value">
                {Math.round((data.overview.totalResponses?.total_responses || 0) / (data.overview.forms?.total_forms || 1))}
              </div>
              <div className="success-description">
                responses per published form
              </div>
            </div>
            <div className="success-item">
              <div className="success-label">Response Conversion Rate</div>
              <div className="success-value">
                {data.overview.completion?.completion_rate || 0}%
              </div>
              <div className="success-description">
                forms completed vs started
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="metric-card large">
        <h3>Form Response Distribution</h3>
        <div className="forms-table">
          <div className="table-header">
            <span>Form ID</span>
            <span>Idea ID</span>
            <span>Response Count</span>
            <span>Performance</span>
          </div>
          {(data.overview.responseDistribution || []).slice(0, 10).map((form, index) => (
            <div key={form.form_id} className="table-row">
              <span className="form-id">Form #{form.form_id}</span>
              <span className="idea-id">Idea #{form.idea_id}</span>
              <span className="response-count">{form.response_count}</span>
              <span className="form-performance">
                <div className="performance-bar">
                  <div 
                    className="performance-fill" 
                    style={{ 
                      width: `${Math.min((form.response_count / 20) * 100, 100)}%`,
                      backgroundColor: COLORS[index % COLORS.length]
                    }}
                  ></div>
                </div>
                <span className="performance-text">{form.response_count} responses</span>
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="metrics-grid">
        <div className="metric-card">
          <h3>Form Creation Trends</h3>
          <div className="trend-metrics">
            <div className="trend-item">
              <div className="trend-label">Active Forms</div>
              <div className="trend-value">{data.overview.completion?.total_forms || 0}</div>
              <div className="trend-description">currently collecting responses</div>
            </div>
            <div className="trend-item">
              <div className="trend-label">Response Rate</div>
              <div className="trend-value">{data.overview.completion?.completion_rate || 0}%</div>
              <div className="trend-description">completion percentage</div>
            </div>
          </div>
        </div>

        <div className="metric-card">
          <h3>Form Quality Score</h3>
          <div className="quality-metrics">
            <div className="quality-item">
              <div className="quality-label">URL Coverage</div>
              <div className="quality-value">
                {Math.round(((data.overview.forms?.forms_with_url || 0) / (data.overview.forms?.total_forms || 1)) * 100)}%
              </div>
              <div className="quality-bar">
                <div 
                  className="quality-fill" 
                  style={{ 
                    width: `${Math.round(((data.overview.forms?.forms_with_url || 0) / (data.overview.forms?.total_forms || 1)) * 100)}%`,
                    backgroundColor: '#10B981'
                  }}
                ></div>
              </div>
            </div>
            <div className="quality-item">
              <div className="quality-label">Response Success</div>
              <div className="quality-value">
                {Math.round(((data.overview.completion?.forms_with_responses || 0) / (data.overview.forms?.total_forms || 1)) * 100)}%
              </div>
              <div className="quality-bar">
                <div 
                  className="quality-fill" 
                  style={{ 
                    width: `${Math.round(((data.overview.completion?.forms_with_responses || 0) / (data.overview.forms?.total_forms || 1)) * 100)}%`,
                    backgroundColor: '#3B82F6'
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// BookingMetrics.js
const BookingMetrics = () => {
  const [period, setPeriod] = useState('30');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    overview: {}
  });

  useEffect(() => {
    fetchBookingData();
    const interval = setInterval(fetchBookingData, 30000);
    return () => clearInterval(interval);
  }, [period]);

  const fetchBookingData = async () => {
    setLoading(true);
    try {
      const overviewRes = await fetch(`/api/analytics/bookings/overview?period=${period}`);
      const overview = await overviewRes.json();
      setData({ overview });
    } catch (error) {
      console.error('Error fetching booking data:', error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

  // Booking status data for pie chart
  const bookingStatusData = data.overview.overview ? [
    { name: 'Confirmed', value: data.overview.overview.confirmed, fill: '#10B981' },
    { name: 'Completed', value: data.overview.overview.completed, fill: '#3B82F6' },
    { name: 'Cancelled', value: data.overview.overview.cancelled, fill: '#EF4444' }
  ] : [];

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading Session Analytics...</p>
      </div>
    );
  }

  return (
    <div className="analytics-page">
      <div className="page-header">
        <div className="header-left">
          <h1>Session Analytics</h1>
          <p>SME booking and session performance insights</p>
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
          <button onClick={fetchBookingData} className="refresh-btn">
            Refresh
          </button>
        </div>
      </div>

      <div className="metrics-grid">
        <div className="metric-card">
          <h3>Session Overview</h3>
          <div className="metric-items">
            <div className="metric-item">
              
              <div className="metric-details">
                <span className="metric-value">{data.overview.overview?.total_bookings || 0}</span>
                <span className="metric-label">Total Bookings</span>
              </div>
            </div>
            <div className="metric-item">
              
              <div className="metric-details">
                <span className="metric-value">{data.overview.overview?.confirmed || 0}</span>
                <span className="metric-label">Confirmed</span>
              </div>
            </div>
            <div className="metric-item">
              
              <div className="metric-details">
                <span className="metric-value">{data.overview.overview?.completed || 0}</span>
                <span className="metric-label">Completed</span>
              </div>
            </div>
            <div className="metric-item">
              
              <div className="metric-details">
                <span className="metric-value">{data.overview.overview?.cancelled || 0}</span>
                <span className="metric-label">Cancelled</span>
              </div>
            </div>
          </div>
        </div>

        <div className="metric-card">
          <h3>Session Quality</h3>
          <div className="metric-items">
            <div className="metric-item">
              
              <div className="metric-details">
                <span className="metric-value">{data.overview.overview?.with_transcript || 0}</span>
                <span className="metric-label">With Transcript</span>
              </div>
            </div>
            <div className="metric-item">
              
              <div className="metric-details">
                <span className="metric-value">{data.overview.overview?.with_recording || 0}</span>
                <span className="metric-label">With Recording</span>
              </div>
            </div>
            <div className="metric-item">
              
              <div className="metric-details">
                <span className="metric-value">{Math.round(data.overview.duration?.avg_duration_minutes || 0)} min</span>
                <span className="metric-label">Avg Duration</span>
              </div>
            </div>
            <div className="metric-item">
              
              <div className="metric-details">
                <span className="metric-value">{data.overview.duration?.completed_sessions || 0}</span>
                <span className="metric-label">Complete Sessions</span>
              </div>
            </div>
          </div>
        </div>

        <div className="metric-card">
          <h3>Booking Status Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={bookingStatusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {bookingStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="metrics-grid">
        <div className="metric-card">
          <h3>Session Success Metrics</h3>
          <div className="success-metrics">
            <div className="success-item">
              <div className="success-label">Completion Rate</div>
              <div className="success-value">
                {Math.round(((data.overview.overview?.completed || 0) / (data.overview.overview?.total_bookings || 1)) * 100)}%
              </div>
              <div className="success-description">
                {data.overview.overview?.completed || 0} of {data.overview.overview?.total_bookings || 0} sessions
              </div>
            </div>
            <div className="success-item">
              <div className="success-label">Cancellation Rate</div>
              <div className="success-value">
                {Math.round(((data.overview.overview?.cancelled || 0) / (data.overview.overview?.total_bookings || 1)) * 100)}%
              </div>
              <div className="success-description">
                {data.overview.overview?.cancelled || 0} cancelled sessions
              </div>
            </div>
            <div className="success-item">
              <div className="success-label">Recording Rate</div>
              <div className="success-value">
                {Math.round(((data.overview.overview?.with_recording || 0) / (data.overview.overview?.completed || 1)) * 100)}%
              </div>
              <div className="success-description">
                {data.overview.overview?.with_recording || 0} recorded sessions
              </div>
            </div>
          </div>
        </div>

        <div className="metric-card">
          <h3>Quality Metrics</h3>
          <div className="quality-breakdown">
            <div className="quality-item">
              <div className="quality-label">Transcript Coverage</div>
              <div className="quality-value">
                {Math.round(((data.overview.overview?.with_transcript || 0) / (data.overview.overview?.completed || 1)) * 100)}%
              </div>
              <div className="quality-bar">
                <div 
                  className="quality-fill" 
                  style={{ 
                    width: `${Math.round(((data.overview.overview?.with_transcript || 0) / (data.overview.overview?.completed || 1)) * 100)}%`,
                    backgroundColor: '#10B981'
                  }}
                ></div>
              </div>
            </div>
            <div className="quality-item">
              <div className="quality-label">Recording Coverage</div>
              <div className="quality-value">
                {Math.round(((data.overview.overview?.with_recording || 0) / (data.overview.overview?.completed || 1)) * 100)}%
              </div>
              <div className="quality-bar">
                <div 
                  className="quality-fill" 
                  style={{ 
                    width: `${Math.round(((data.overview.overview?.with_recording || 0) / (data.overview.overview?.completed || 1)) * 100)}%`,
                    backgroundColor: '#3B82F6'
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="metric-card large">
        <h3>Session Performance Summary</h3>
        <div className="performance-summary">
          <div className="summary-grid">
            <div className="summary-item">
              
              <div className="summary-content">
                <div className="summary-title">Session Efficiency</div>
                <div className="summary-value">
                  {Math.round(((data.overview.overview?.completed || 0) / (data.overview.overview?.confirmed || 1)) * 100)}%
                </div>
                <div className="summary-description">Confirmed to completed ratio</div>
              </div>
            </div>
            <div className="summary-item">
              
              <div className="summary-content">
                <div className="summary-title">Data Capture Rate</div>
                <div className="summary-value">
                  {Math.round(((data.overview.overview?.with_transcript || 0) / (data.overview.overview?.completed || 1)) * 100)}%
                </div>
                <div className="summary-description">Sessions with useful data</div>
              </div>
            </div>
            <div className="summary-item">
              
              <div className="summary-content">
                <div className="summary-title">Average Session</div>
                <div className="summary-value">
                  {Math.round(data.overview.duration?.avg_duration_minutes || 0)} min
                </div>
                <div className="summary-description">Optimal session length</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export { FormMetrics, BookingMetrics };