// frontend/src/components/IdeaMetrics.js
import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, FunnelChart, Funnel, LabelList, AreaChart, Area } from 'recharts';

const IdeaMetrics = () => {
  const [period, setPeriod] = useState('30');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    overview: {},
    validation: {},
    trends: {}
  });

  useEffect(() => {
    fetchIdeaData();
    const interval = setInterval(fetchIdeaData, 30000); // Auto-refresh every 30 seconds
    return () => clearInterval(interval);
  }, [period]);

  const fetchIdeaData = async () => {
    setLoading(true);
    try {
      const [overviewRes, validationRes, trendsRes] = await Promise.all([
        fetch(`/api/analytics/ideas/overview?period=${period}`),
        fetch('/api/analytics/ideas/validation'),
        fetch(`/api/analytics/ideas/trends?period=${period}`)
      ]);

      const overview = await overviewRes.json();
      const validation = await validationRes.json();
      const trends = await trendsRes.json();

      setData({ overview, validation, trends });
    } catch (error) {
      console.error('Error fetching idea data:', error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

  // Validation funnel data
  const validationFunnelData = data.validation.validationFunnel ? [
    { name: 'Ideas Submitted', value: data.validation.validationFunnel.total_ideas, fill: '#3B82F6' },
    { name: 'Forms Created', value: data.validation.validationFunnel.forms_created, fill: '#10B981' },
    { name: 'Forms with Responses', value: data.validation.validationFunnel.forms_with_responses, fill: '#F59E0B' },
    { name: 'Total Responses', value: data.validation.validationFunnel.total_responses, fill: '#EF4444' }
  ] : [];

  // AI Pipeline Progress
  const aiPipelineData = data.overview.aiPipeline ? [
    {
      name: 'Idea Capture',
      completed: data.overview.aiPipeline.idea_capture_complete,
      rate: data.overview.aiPipeline.idea_capture_rate,
      color: '#3B82F6'
    },
    {
      name: 'Lens Selector',
      completed: data.overview.aiPipeline.lens_selector_complete,
      rate: data.overview.aiPipeline.lens_selector_rate,
      color: '#10B981'
    },
    {
      name: 'Survey Generator',
      completed: data.overview.aiPipeline.survey_generator_complete,
      rate: data.overview.aiPipeline.survey_generator_rate,
      color: '#F59E0B'
    }
  ] : [];

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading Idea Analytics...</p>
      </div>
    );
  }

  return (
    <div className="analytics-page">
      {/* Page Header */}
      <div className="page-header">
        <div className="header-left">
          <h1>💡 Idea Analytics</h1>
          <p>Comprehensive insights into idea submission and validation performance</p>
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
          <button onClick={fetchIdeaData} className="refresh-btn">
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Idea Overview Metrics */}
      <div className="metrics-grid">
        <div className="metric-card">
          <h3> Ideas Overview</h3>
          <div className="metric-items">
            <div className="metric-item">
              
              <div className="metric-details">
                <span className="metric-value">{data.overview.overview?.total_ideas || 0}</span>
                <span className="metric-label">Total Ideas</span>
              </div>
            </div>
            <div className="metric-item">
              
              <div className="metric-details">
                <span className="metric-value">{data.overview.overview?.with_pitch_deck || 0}</span>
                <span className="metric-label">With Pitch Deck</span>
              </div>
            </div>
            <div className="metric-item">
              
              <div className="metric-details">
                <span className="metric-value">{data.overview.overview?.with_voice_note || 0}</span>
                <span className="metric-label">With Voice Note</span>
              </div>
            </div>
            <div className="metric-item">
              
              <div className="metric-details">
                <span className="metric-value">{data.overview.overview?.ai_processed || 0}</span>
                <span className="metric-label">AI Processed</span>
              </div>
            </div>
          </div>
        </div>

        {/* AI Processing Pipeline */}
        <div className="metric-card">
          <h3>🤖 AI Processing Pipeline</h3>
          <div className="ai-pipeline">
            {aiPipelineData.map((stage, index) => (
              <div key={stage.name} className="pipeline-stage">
                <div className="stage-header">
                  <span className="stage-name">{stage.name}</span>
                  <span className="stage-rate">{stage.rate}%</span>
                </div>
                <div className="stage-progress">
                  <div 
                    className="stage-fill" 
                    style={{ 
                      width: `${stage.rate}%`,
                      backgroundColor: stage.color
                    }}
                  ></div>
                </div>
                <div className="stage-count">{stage.completed} completed</div>
              </div>
            ))}
          </div>
        </div>

        {/* Validation Success Rates */}
        <div className="metric-card">
          <h3>📈 Validation Success Rates</h3>
          <div className="success-metrics">
            <div className="success-item">
              <div className="success-label">Form Creation Rate</div>
              <div className="success-value">
                {data.validation.validationFunnel?.form_creation_rate || 0}%
              </div>
              <div className="success-description">
                {data.validation.validationFunnel?.forms_created || 0} of {data.validation.validationFunnel?.total_ideas || 0} ideas
              </div>
            </div>
            <div className="success-item">
              <div className="success-label">Response Rate</div>
              <div className="success-value">
                {data.validation.validationFunnel?.response_rate || 0}%
              </div>
              <div className="success-description">
                {data.validation.validationFunnel?.forms_with_responses || 0} of {data.validation.validationFunnel?.forms_created || 0} forms
              </div>
            </div>
            <div className="success-item">
              <div className="success-label">Avg Responses per Form</div>
              <div className="success-value">
                {data.validation.validationFunnel?.avg_responses_per_form || 0}
              </div>
              <div className="success-description">
                {data.validation.validationFunnel?.total_responses || 0} total responses
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Validation Funnel */}
      <div className="metrics-grid">
        <div className="metric-card large">
          <h3>🎯 Idea Validation Funnel</h3>
          <div className="funnel-container">
            <ResponsiveContainer width="100%" height={300}>
              <FunnelChart>
                <Tooltip />
                <Funnel
                  dataKey="value"
                  data={validationFunnelData}
                  isAnimationActive
                >
                  <LabelList position="center" fill="#fff" stroke="none" />
                </Funnel>
              </FunnelChart>
            </ResponsiveContainer>
          </div>
          <div className="funnel-stats">
            {validationFunnelData.map((item, index) => (
              <div key={item.name} className="funnel-stat">
                <div className="stat-color" style={{ backgroundColor: item.fill }}></div>
                <span className="stat-label">{item.name}</span>
                <span className="stat-value">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Ideas by Stage */}
        <div className="metric-card">
          <h3>🏗️ Ideas by Development Stage</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data.overview.byStage || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="stage" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
          <div className="stage-details">
            {(data.overview.byStage || []).map((stage, index) => (
              <div key={index} className="stage-detail">
                <span className="stage-name">{stage.stage}</span>
                <span className="stage-count">{stage.count} ideas</span>
                <span className="stage-age">{stage.avg_days_old} days avg</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Idea Submission Trends */}
      <div className="metrics-grid">
        <div className="metric-card large">
          <h3>📈 Idea Submission Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data.trends.submissionTrends || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="total_ideas"
                stackId="1"
                stroke="#3B82F6"
                fill="#3B82F6"
                fillOpacity={0.8}
                name="Total Ideas"
              />
              <Area
                type="monotone"
                dataKey="with_pitch_deck"
                stackId="2"
                stroke="#10B981"
                fill="#10B981"
                fillOpacity={0.6}
                name="With Pitch Deck"
              />
              <Area
                type="monotone"
                dataKey="ai_processed"
                stackId="3"
                stroke="#F59E0B"
                fill="#F59E0B"
                fillOpacity={0.4}
                name="AI Processed"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Target Audience Distribution */}
        <div className="metric-card">
          <h3>🎯 Target Audience Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={data.overview.byAudience || []}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {(data.overview.byAudience || []).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Creator Productivity */}
      <div className="metric-card large">
        <h3>🏆 Creator Productivity Rankings</h3>
        <div className="productivity-table">
          <div className="table-header">
            <span>Creator</span>
            <span>Ideas Submitted</span>
            <span>Forms Created</span>
            <span>Responses Received</span>
            <span>First Idea</span>
            <span>Latest Idea</span>
            <span>Success Rate</span>
          </div>
          {(data.trends.creatorProductivity || []).map((creator, index) => (
            <div key={creator.creator_id} className="table-row">
              <span className="creator-name">
                <div className="creator-avatar">{index + 1}</div>
                {creator.creator_name || 'Anonymous'}
              </span>
              <span className="creator-ideas">{creator.ideas_submitted}</span>
              <span className="creator-forms">{creator.forms_created}</span>
              <span className="creator-responses">{creator.responses_received}</span>
              <span className="creator-first">
                {new Date(creator.first_idea_date).toLocaleDateString()}
              </span>
              <span className="creator-latest">
                {new Date(creator.latest_idea_date).toLocaleDateString()}
              </span>
              <span className="creator-success">
                {creator.ideas_submitted > 0 
                  ? Math.round((creator.forms_created / creator.ideas_submitted) * 100)
                  : 0}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Idea Performance Breakdown */}
      <div className="metric-card large">
        <h3>💡 Individual Idea Performance</h3>
        <div className="ideas-table">
          <div className="table-header">
            <span>Idea Name</span>
            <span>Creator</span>
            <span>Stage</span>
            <span>Target Audience</span>
            <span>Forms</span>
            <span>Responses</span>
            <span>AI Processed</span>
            <span>Created</span>
          </div>
          {(data.validation.ideaPerformance || []).map((idea, index) => (
            <div key={idea.id} className="table-row">
              <span className="idea-name" title={idea.name}>
                {idea.name.length > 30 ? `${idea.name.substring(0, 30)}...` : idea.name}
              </span>
              <span className="idea-creator">{idea.creator_name || 'Anonymous'}</span>
              <span className="idea-stage">
                <div className={`stage-badge ${idea.stage.toLowerCase().replace(/\s+/g, '-')}`}>
                  {idea.stage}
                </div>
              </span>
              <span className="idea-audience">{idea.targeted_audience}</span>
              <span className="idea-forms">{idea.forms_count}</span>
              <span className="idea-responses">{idea.responses_count}</span>
              <span className={`idea-ai ${idea.ai_processed === 'Yes' ? 'processed' : 'not-processed'}`}>
                {idea.ai_processed}
              </span>
              <span className="idea-created">
                {new Date(idea.created_at).toLocaleDateString()}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Content Analysis */}
      <div className="metrics-grid">
        <div className="metric-card">
          <h3>📎 Content Attachment Analysis</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data.validation.contentAnalysis || []} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="content_type" type="category" />
              <Tooltip />
              <Bar dataKey="percentage" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Success Metrics Summary */}
        <div className="metric-card">
          <h3>📊 Success Metrics Summary</h3>
          <div className="success-summary">
            {(data.trends.successMetrics || []).map((metric, index) => (
              <div key={index} className="summary-item">
                <div className="summary-metric">{metric.metric}</div>
                <div className="summary-value">{metric.current_value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default IdeaMetrics;