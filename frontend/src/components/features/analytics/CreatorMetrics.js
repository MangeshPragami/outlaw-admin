// frontend/src/components/CreatorMetrics.js - FIXED VERSION
import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, FunnelChart, Funnel, LabelList } from 'recharts';

const CreatorMetrics = () => {
  const [period, setPeriod] = useState('30');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    overview: {},
    demographics: {},
    performance: {}
  });

  useEffect(() => {
    fetchCreatorData();
    const interval = setInterval(fetchCreatorData, 30000);
    return () => clearInterval(interval);
  }, [period]);

  const fetchCreatorData = async () => {
    setLoading(true);
    try {
     
      const [overviewRes, demographicsRes, performanceRes] = await Promise.all([
        fetch(`api/analytics/creators/overview?period=${period}`),
        fetch('api/analytics/creators/demographics'),
        fetch(`api/analytics/creators/performance?period=${period}`)
      ]);

      const overview = await overviewRes.json();
      const demographics = await demographicsRes.json();
      const performance = await performanceRes.json();

      setData({ overview, demographics, performance });
    } catch (error) {
      console.error('Error fetching creator data:', error);
      // Fallback data for graceful degradation
      setData({
        overview: {
          funnel: { total_users: 0, identified_creators: 0, creators_with_profiles: 0, creators_with_ideas: 0, creators_with_forms: 0 },
          byPersona: [],
          engagementLevels: []
        },
        demographics: { byIndustry: [], byCountry: [] },
        performance: { activityTrends: [], topCreators: [], conversionRates: [] }
      });
    } finally {
      setLoading(false);
    }
  };
  

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

  const funnelData = data.overview.funnel ? [
    { name: 'Total Users', value: data.overview.funnel.total_users, fill: '#3B82F6' },
    { name: 'Identified Creators', value: data.overview.funnel.identified_creators, fill: '#10B981' },
    { name: 'With Profiles', value: data.overview.funnel.creators_with_profiles, fill: '#F59E0B' },
    { name: 'With Ideas', value: data.overview.funnel.creators_with_ideas, fill: '#EF4444' },
    { name: 'With Forms', value: data.overview.funnel.creators_with_forms, fill: '#8B5CF6' }
  ] : [];

  if (loading) {
    return (
      <div className="loading-container-professional">
        <div className="loading-spinner-professional"></div>
        <p>Loading Creator Analytics...</p>
      </div>
    );
  }

  return (
    <div className="analytics-page-professional">
      {/* Page Header */}
      <div className="page-header-professional">
        <div className="header-left-professional">
          <h1>Creator Analytics</h1>
          <p>Comprehensive insights into creator behavior and performance</p>
          <span className="last-updated-professional">Last updated: {new Date().toLocaleTimeString()}</span>
        </div>
        <div className="header-controls-professional">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="period-selector-professional"
          >
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="90">Last 90 Days</option>
            <option value="all">All Time</option>
          </select>
          <button onClick={fetchCreatorData} className="refresh-btn-professional">
            Refresh
          </button>
        </div>
      </div>

      {/* Creator Funnel Overview */}
      <div className="metrics-grid-professional">
        <div className="metric-card-professional large">
          <h3>Creator Journey Conversion Funnel</h3>
          <div className="funnel-container">
            <ResponsiveContainer width="100%" height={300}>
              <FunnelChart>
                <Tooltip />
                <Funnel
                  dataKey="value"
                  data={funnelData}
                  isAnimationActive
                >
                  <LabelList position="center" fill="#fff" stroke="none" />
                </Funnel>
              </FunnelChart>
            </ResponsiveContainer>
          </div>
          <div className="funnel-stats">
            {funnelData.map((item, index) => (
              <div key={item.name} className="funnel-stat">
                <div className="stat-color" style={{ backgroundColor: item.fill }}></div>
                <span className="stat-label">{item.name}</span>
                <span className="stat-value">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Key Creator Metrics */}
        <div className="metric-card-professional">
          <h3>Creator Overview</h3>
          <div className="metric-items-professional">
            <div className="metric-item-professional">
              <div className="metric-details-professional">
                <span className="metric-value-professional">{data.overview.funnel?.total_users || 0}</span>
                <span className="metric-label-professional">TOTAL USERS</span>
              </div>
            </div>
            <div className="metric-item-professional">
              <div className="metric-details-professional">
                <span className="metric-value-professional">{data.overview.funnel?.identified_creators || 0}</span>
                <span className="metric-label-professional">IDENTIFIED CREATORS</span>
              </div>
            </div>
            <div className="metric-item-professional">
              <div className="metric-details-professional">
                <span className="metric-value-professional">{data.overview.funnel?.creators_with_ideas || 0}</span>
                <span className="metric-label-professional">ACTIVE CREATORS</span>
              </div>
            </div>
            <div className="metric-item-professional">
              <div className="metric-details-professional">
                <span className="metric-value-professional">{data.overview.funnel?.creators_with_forms || 0}</span>
                <span className="metric-label-professional">FORM CREATORS</span>
              </div>
            </div>
          </div>
        </div>

        {/* Persona Breakdown */}
        <div className="metric-card-professional">
          <h3>User Persona Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={data.overview.byPersona || []}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {(data.overview.byPersona || []).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Creator Performance Trends */}
      <div className="metrics-grid-professional">
        <div className="metric-card-professional large">
          <h3>Creator Registration Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.performance.activityTrends || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="new_creators"
                stroke="#3B82F6"
                strokeWidth={3}
                dot={{ r: 6 }}
                name="New Creators"
              />
              <Line
                type="monotone"
                dataKey="total_new_users"
                stroke="#10B981"
                strokeWidth={2}
                dot={{ r: 4 }}
                name="Total New Users"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Conversion Rates */}
        <div className="metric-card-professional">
          <h3>Conversion Rates</h3>
          <div className="conversion-metrics-professional">
            {(data.performance.conversionRates || []).map((conversion, index) => (
              <div key={index} className="conversion-item-professional">
                <div className="conversion-step-professional">{conversion.conversion_step}</div>
                <div className="conversion-rate-professional">
                  <span className="rate-value-professional">{conversion.conversion_rate}%</span>
                  <div className="rate-bar-professional">
                    <div 
                      className="rate-fill-professional" 
                      style={{ width: `${conversion.conversion_rate}%` }}
                    ></div>
                  </div>
                </div>
                <div className="conversion-numbers-professional">
                  {conversion.converted_users} / {conversion.total_users}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Demographics */}
      <div className="metrics-grid-professional">
        <div className="metric-card-professional">
          <h3>Creator Industries</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data.demographics.byIndustry || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="industry" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="metric-card-professional">
          <h3>Geographic Distribution</h3>
          <div className="geography-list-professional">
            {(data.demographics.byCountry || []).map((country, index) => (
              <div key={index} className="geography-item-professional">
                <span className="country-name-professional">{country.country}</span>
                <div className="country-stats-professional">
                  <span className="total-count">{country.count} users</span>
                  <span className="founder-count">{country.founders} founders</span>
                  <span className="ideas-count">{country.total_ideas} ideas</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Performing Creators */}
      <div className="metric-card-professional large">
        <h3>Top Performing Creators</h3>
        <div className="table-container-professional">
          <table className="creators-table-professional">
            <thead>
              <tr>
                <th>Creator</th>
                <th>Industry</th>
                <th>Ideas</th>
                <th>Forms</th>
                <th>Responses</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {(data.performance.topCreators || []).map((creator, index) => (
                <tr key={creator.id}>
                  <td>
                    <div className="creator-name-professional">
                      <div className="creator-rank-professional">{index + 1}</div>
                      {creator.name || 'Anonymous'}
                    </div>
                  </td>
                  <td>{creator.industry || 'Not specified'}</td>
                  <td className="metric-highlight-professional">{creator.ideas_count}</td>
                  <td className="metric-highlight-professional">{creator.forms_count}</td>
                  <td className="metric-highlight-professional">{creator.responses_received}</td>
                  <td>{new Date(creator.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Engagement Levels */}
      <div className="metric-card-professional">
        <h3>Creator Engagement Levels</h3>
        <div className="engagement-breakdown-professional">
          {(data.overview.engagementLevels || []).map((level, index) => (
            <div key={index} className="engagement-level-professional">
              <div className="level-header-professional">
                <span className="level-name-professional">{level.engagement_level}</span>
                <span className="level-count-professional">{level.creator_count}</span>
              </div>
              <div className="level-bar-professional">
                <div 
                  className="level-fill-professional" 
                  style={{ 
                    width: `${(level.creator_count / (data.overview.funnel?.total_users || 1)) * 100}%`,
                    backgroundColor: COLORS[index % COLORS.length]
                  }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CreatorMetrics;