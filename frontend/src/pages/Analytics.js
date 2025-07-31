// frontend/src/pages/Analytics.js
import React, { useState, useEffect, useContext, useCallback } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { AuthContext } from '../contexts/AuthContext';
import { analyticsAPI } from '../services/api';
import './Analytics.css'; 

const Analytics = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [period, setPeriod] = useState('all');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({});
  const [error, setError] = useState(null);
  const { } = useContext(AuthContext);

  // Modern color palette
  const COLORS = ['#8A5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#06B6D4', '#84CC16', '#F97316'];

  // Load dashboard data
  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Testing health check...');
      const healthCheck = await analyticsAPI.health();
      console.log('Health check result:', healthCheck);
      
      if (!healthCheck || healthCheck.status !== 'OK') {
        throw new Error('Backend server is not responding');
      }

      console.log('Loading all analytics data...');
      
      const [
        usersOverview,
        usersGrowth,
        ideasOverview,
        formsOverview,
        smeOverview,
        bookingsOverview,
        engagementFunnel,
        realtime,
        demographics,
        chimeOverview
      ] = await Promise.all([
        analyticsAPI.getUsersOverview(period).catch(e => { console.error('Users overview error:', e); return null; }),
        analyticsAPI.getUsersGrowth('30').catch(e => { console.error('Users growth error:', e); return null; }),
        analyticsAPI.getIdeasOverview(period).catch(e => { console.error('Ideas overview error:', e); return null; }),
        analyticsAPI.getFormsOverview(period).catch(e => { console.error('Forms overview error:', e); return null; }),
        analyticsAPI.getSMEOverview(period).catch(e => { console.error('SME overview error:', e); return null; }),
        analyticsAPI.getBookingsOverview(period).catch(e => { console.error('Bookings overview error:', e); return null; }),
        analyticsAPI.getEngagementFunnel().catch(e => { console.error('Engagement funnel error:', e); return null; }),
        analyticsAPI.getRealtime().catch(e => { console.error('Realtime error:', e); return null; }),
        analyticsAPI.getUsersDemographics().catch(e => { console.error('Demographics error:', e); return null; }),
        analyticsAPI.getChimeOverview(period).catch(e => { console.error('Chime overview error:', e); return null; })
      ]);

      setData({
        usersOverview,
        usersGrowth,
        ideasOverview,
        formsOverview,
        smeOverview,
        bookingsOverview,
        engagementFunnel,
        realtime,
        demographics,
        chimeOverview
      });
      // Add this right after setData({...}) in loadDashboardData function
console.log('=== COMPLETE DATA DEBUG ===');
console.log('usersOverview:', usersOverview);
console.log('usersOverview?.byPersonaType:', usersOverview?.byPersonaType);
console.log('demographics:', demographics);
console.log('demographics?.byCountry:', demographics?.byCountry);
console.log('Array check:', Array.isArray(usersOverview?.byPersonaType));
console.log('Length check:', usersOverview?.byPersonaType?.length);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError(error.message);
    }
    setLoading(false);
  }, [period]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Tab configuration
  const tabs = [
    { id: 'overview', label: 'Overview', icon: '◉' },
    { id: 'users', label: 'Users', icon: '◎' },
    { id: 'ideas', label: 'Ideas', icon: '◈' },
    { id: 'forms', label: 'Forms', icon: '◐' },
    { id: 'sessions', label: 'Sessions', icon: '◑' },
    { id: 'engagement', label: 'Engagement', icon: '◒' }
  ];

  const periods = [
    { value: 'all', label: 'All Time' },
    { value: 'month', label: 'Last 30 Days' },
    { value: 'week', label: 'Last 7 Days' },
    { value: 'today', label: 'Today' }
  ];

  // Professional Metric Card Component
  const MetricCard = ({ title, value, change, subtitle, trend, color = 'purple' }) => {
    const colorClasses = {
      purple: 'bg-purple-main',
      blue: 'bg-gradient-to-r-purple',
      green: 'bg-gradient-to-r from-green-500 to-green-600',
      orange: 'bg-gradient-to-r from-orange-500 to-orange-600',
      red: 'bg-gradient-to-r from-red-500 to-red-600',
      indigo: 'bg-gradient-to-r from-indigo-500 to-indigo-600'
    };
    return (
      <div className={`card-dark card-accent p-6 hover:shadow-purple transition-shadow duration-200`}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-purple-main uppercase tracking-wide mb-2">{title}</p>
            <div className="flex items-baseline space-x-2">
              <p className="text-3xl font-bold text-white">{value || 0}</p>
              {change && (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${change >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{change >= 0 ? '↗' : '↘'} {Math.abs(change)}%</span>
              )}
            </div>
            {subtitle && (
              <p className="text-sm text-gray-400 mt-1">{subtitle}</p>
            )}
          </div>
          <div className={`w-12 h-12 rounded-xl ${colorClasses[color]} flex items-center justify-center shadow-purple`}>
            <div className="w-6 h-6 bg-purple-main rounded opacity-90"></div>
          </div>
        </div>
        {trend && (
          <div className="mt-4 pt-4 border-t border-purple-main">
            <div className="flex items-center text-sm text-gray-400">
              <span className={`inline-block w-2 h-2 rounded-full mr-2 ${trend > 0 ? 'bg-green-400' : trend < 0 ? 'bg-red-400' : 'bg-gray-400'}`}></span>
              Trending {trend > 0 ? 'up' : trend < 0 ? 'down' : 'stable'} this period
            </div>
          </div>
        )}
      </div>
    );
  };

  // Chart wrapper component
  const ChartCard = ({ title, children, className = "", fullWidth = false }) => (
    <div className={`card-dark card-accent p-6 hover:shadow-purple transition-shadow duration-200 ${fullWidth ? 'col-span-full' : ''} ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="heading-main">{title}</h3>
        <div className="w-2 h-2 bg-purple-main rounded-full"></div>
      </div>
      <div className="h-80">
        {children}
      </div>
    </div>
  );

  // Status Badge Component
  const StatusBadge = ({ status, count }) => {
    const statusColors = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      pending: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-blue-100 text-blue-800'
    };

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusColors[status] || statusColors.inactive}`}>
        {status} {count && `(${count})`}
      </span>
    );
  };

  // Error display
  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="card-dark card-accent max-w-md w-full p-8">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto bg-purple-main rounded-full flex items-center justify-center mb-4">
              <div className="w-8 h-8 bg-black rounded"></div>
            </div>
            <h2 className="text-xl font-semibold text-purple-main mb-2">Connection Error</h2>
            <p className="text-gray-400 mb-4">{error}</p>
            <p className="text-sm text-gray-500 mb-6">
              Make sure your backend server is running on http://localhost:3001
            </p>
            <button
              onClick={loadDashboardData}
              className="btn-primary w-full"
            >
              Retry Connection
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Overview Tab
  const OverviewTab = () => {
    const { usersOverview, ideasOverview, formsOverview, realtime } = data;
    
    return (
      <div className="space-y-8">
        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Total Users"
            value={usersOverview?.totalUsers?.total_users}
            subtitle="Platform registrations"
            color="blue"
            trend={1}
          />
          <MetricCard
            title="Total Ideas"
            value={ideasOverview?.total?.total_ideas}
            subtitle="Innovation submissions"
            color="purple"
            trend={1}
          />
          <MetricCard
            title="Active Forms"
            value={formsOverview?.forms?.total_forms}
            subtitle="Survey campaigns"
            color="green"
            trend={0}
          />
          <MetricCard
            title="Form Responses"
            value={formsOverview?.totalResponses?.total_responses}
            subtitle="Feedback collected"
            color="orange"
            trend={1}
          />
        </div>

        {/* Today's Activity Panel */}
        {realtime && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              Today's Activity
              <span className="ml-2 w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center bg-white rounded-lg p-4 shadow-sm">
                <div className="text-3xl font-bold text-blue-600 mb-1">
                  {realtime.today?.new_users_today || 0}
                </div>
                <div className="text-sm font-medium text-gray-600">New Users</div>
              </div>
              <div className="text-center bg-white rounded-lg p-4 shadow-sm">
                <div className="text-3xl font-bold text-green-600 mb-1">
                  {realtime.today?.new_ideas_today || 0}
                </div>
                <div className="text-sm font-medium text-gray-600">New Ideas</div>
              </div>
              <div className="text-center bg-white rounded-lg p-4 shadow-sm">
                <div className="text-3xl font-bold text-purple-600 mb-1">
                  {realtime.today?.new_responses_today || 0}
                </div>
                <div className="text-sm font-medium text-gray-600">New Responses</div>
              </div>
            </div>
          </div>
        )}

        {/* User Growth Chart */}
        {data.usersGrowth && data.usersGrowth.length > 0 && (
          <ChartCard title="User Growth Trend (30 Days)" fullWidth>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.usersGrowth}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }} 
                />
                <Area 
                  type="monotone" 
                  dataKey="cumulative_users" 
                  stroke="#3B82F6" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorUsers)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        )}
      </div>
    );
  };

  // Users Tab
  const UsersTab = () => {
    const { usersOverview, demographics } = data;
    
    return (
      <div className="space-y-8">
        {/* User Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MetricCard
            title="Total Users"
            value={usersOverview?.totalUsers?.total_users}
            subtitle="Platform registrations"
            color="blue"
          />
          <MetricCard
            title="Email Verified"
            value={`${usersOverview?.verification?.verification_rate || 0}%`}
            subtitle="Account verification rate"
            color="green"
          />
          <MetricCard
            title="Profile Completion"
            value={`${demographics?.profileCompletion?.completion_rate || 0}%`}
            subtitle="Complete user profiles"
            color="purple"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* User Types Distribution */}
          {usersOverview?.byPersonaType && usersOverview.byPersonaType.length > 0 && (
            <ChartCard title="User Distribution by Type">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={usersOverview.byPersonaType}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({persona_type, count, percent}) => `${persona_type}: ${count} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="count"
                    nameKey="persona_type"
                  >
                    {usersOverview.byPersonaType.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          )}

          {/* Geographic Distribution */}
          {demographics?.byCountry && demographics.byCountry.length > 0 && (
            <ChartCard title="Geographic Distribution (Top 10)">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={demographics.byCountry.slice(0, 10)} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" stroke="#6b7280" fontSize={12} />
                  <YAxis dataKey="country" type="category" stroke="#6b7280" fontSize={12} width={80} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }} 
                  />
                  <Bar dataKey="count" fill="#3B82F6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          )}
        </div>
      </div>
    );
  };

  // Ideas Tab
  const IdeasTab = () => {
    const { ideasOverview } = data;
    
    return (
      <div className="space-y-8">
        {/* Ideas Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MetricCard
            title="Total Ideas"
            value={ideasOverview?.total?.total_ideas}
            subtitle="Innovation submissions"
            color="purple"
          />
          <MetricCard
            title="With Pitch Deck"
            value={ideasOverview?.attachments?.with_pitch_deck}
            subtitle="Professional presentations"
            color="blue"
          />
          <MetricCard
            title="With Voice Note"
            value={ideasOverview?.attachments?.with_voice_note}
            subtitle="Audio explanations"
            color="green"
          />
        </div>

        {/* Ideas by Stage */}
        {ideasOverview?.byStage && ideasOverview.byStage.length > 0 && (
          <ChartCard title="Ideas by Development Stage" fullWidth>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ideasOverview.byStage}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="stage" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }} 
                />
                <Bar dataKey="count" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}
      </div>
    );
  };

  // Forms Tab
  const FormsTab = () => {
    const { formsOverview } = data;
    
    return (
      <div className="space-y-8">
        {/* Forms Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MetricCard
            title="Total Forms"
            value={formsOverview?.forms?.total_forms}
            subtitle="Survey campaigns"
            color="green"
          />
          <MetricCard
            title="Total Responses"
            value={formsOverview?.totalResponses?.total_responses}
            subtitle="Feedback collected"
            color="blue"
          />
          <MetricCard
            title="Completion Rate"
            value={`${formsOverview?.completion?.completion_rate || 0}%`}
            subtitle="Response success rate"
            color="purple"
          />
        </div>

        {/* Form Statistics */}
        {formsOverview && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Form Performance Metrics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <span className="text-gray-700 font-medium">Forms with URL</span>
                <StatusBadge status="active" count={formsOverview.forms?.forms_with_url || 0} />
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <span className="text-gray-700 font-medium">Forms with Responses</span>
                <StatusBadge status="completed" count={formsOverview.completion?.forms_with_responses || 0} />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Sessions Tab
  const SessionsTab = () => {
    const { bookingsOverview, chimeOverview } = data;
    
    return (
      <div className="space-y-8">
        {/* Session Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <MetricCard
            title="Total Sessions"
            value={chimeOverview?.sessionOverview?.total_sessions || bookingsOverview?.overview?.total_bookings}
            subtitle="Video conferences"
            color="blue"
          />
          <MetricCard
            title="Completed"
            value={chimeOverview?.sessionOverview?.completed_sessions || bookingsOverview?.overview?.completed}
            subtitle="Successful sessions"
            color="green"
          />
          <MetricCard
            title="With Transcripts"
            value={chimeOverview?.sessionOverview?.sessions_with_transcripts}
            subtitle="AI transcribed"
            color="purple"
          />
          <MetricCard
            title="Avg Duration"
            value={`${Math.round(chimeOverview?.durationStats?.avg_duration_minutes || bookingsOverview?.duration?.avg_duration_minutes || 0)} min`}
            subtitle="Session length"
            color="orange"
          />
        </div>

        {/* Session Analytics */}
        {chimeOverview?.sessionOverview && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Session Quality Metrics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <span className="text-gray-700 font-medium">Completion Rate</span>
                <span className="text-2xl font-bold text-green-600">
                  {chimeOverview.sessionOverview.completion_rate}%
                </span>
              </div>
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <span className="text-gray-700 font-medium">With Recordings</span>
                <span className="text-2xl font-bold text-blue-600">
                  {chimeOverview.sessionOverview.sessions_with_recordings}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Engagement Tab
  const EngagementTab = () => {
    const { engagementFunnel, smeOverview } = data;
    
    return (
      <div className="space-y-8">
        {/* Engagement Funnel */}
        {engagementFunnel && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">User Journey Conversion Funnel</h3>
            <div className="space-y-4">
              {[
                { label: 'Total Users', value: engagementFunnel.userJourney?.total_users || 0, width: '100%' },
                { label: 'Users with Profiles', value: engagementFunnel.userJourney?.users_with_profiles || 0, width: '85%' },
                { label: 'Users with Ideas', value: engagementFunnel.userJourney?.users_with_ideas || 0, width: '60%' },
                { label: 'Users with Forms', value: engagementFunnel.userJourney?.users_with_forms || 0, width: '40%' },
                { label: 'Users with Responses', value: engagementFunnel.userJourney?.users_with_responses || 0, width: '25%' }
              ].map((step, index) => (
                <div key={index} className="flex items-center space-x-4">
                  <div className="w-48 text-sm font-medium text-gray-700">{step.label}</div>
                  <div className="flex-1 bg-gray-200 rounded-full h-4 relative overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full transition-all duration-1000 ease-out"
                      style={{ width: step.width }}
                    ></div>
                  </div>
                  <div className="w-16 text-right text-sm font-bold text-gray-900">{step.value}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SME Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MetricCard
            title="Total SMEs"
            value={smeOverview?.overview?.total_smes}
            subtitle="Subject matter experts"
            color="indigo"
          />
          <MetricCard
            title="Verified SMEs"
            value={smeOverview?.overview?.verified_smes}
            subtitle="Validated experts"
            color="green"
          />
          <MetricCard
            title="Active SMEs"
            value={smeOverview?.overview?.responding_smes}
            subtitle="Currently responding"
            color="blue"
          />
        </div>

        {/* SME by Industry */}
        {smeOverview?.byIndustry && smeOverview.byIndustry.length > 0 && (
          <ChartCard title="SME Distribution by Industry" fullWidth>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={smeOverview.byIndustry.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="industry" stroke="#6b7280" fontSize={12} angle={-45} textAnchor="end" height={80} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }} 
                />
                <Bar dataKey="sme_count" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}
      </div>
    );
  };

  // Render tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview': return <OverviewTab />;
      case 'users': return <UsersTab />;
      case 'ideas': return <IdeasTab />;
      case 'forms': return <FormsTab />;
      case 'sessions': return <SessionsTab />;
      case 'engagement': return <EngagementTab />;
      default: return <OverviewTab />;
    }
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Professional Header */}
      <div className="bg-black shadow-sm border-b border-purple-main">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-8">
            <div>
              <h1 className="heading-main bg-clip-text text-transparent">Analytics Dashboard</h1>
              <p className="text-lg text-gray-400 mt-2">Monitor your platform performance and user engagement</p>
            </div>
            {/* Period Selector */}
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-purple-main">Time Period:</label>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="border border-purple-main rounded-lg px-4 py-2 bg-black text-purple-main focus:outline-none focus:ring-2 focus:ring-purple-main focus:border-transparent shadow-sm min-w-[140px]"
              >
                {periods.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
          </div>
          {/* Modern Tab Navigation */}
          <div className="flex space-x-1 bg-black p-1 rounded-lg mb-0">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center py-3 px-4 rounded-md font-medium text-sm transition-all duration-200 ${activeTab === tab.id ? 'bg-purple-main text-white shadow-purple' : 'text-purple-main hover:text-white hover:bg-black'}`}
              >
                <span className="mr-2 text-base">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-main"></div>
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-black border-t-transparent absolute top-0 left-0"></div>
            </div>
          </div>
        ) : (
          <div className="animate-fade-in">
            {renderTabContent()}
          </div>
        )}
      </div>

      {/* Professional Footer */}
      <footer className="bg-black border-t border-purple-main mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center space-x-6">
              <span className="flex items-center"><span className="w-2 h-2 bg-purple-main rounded-full mr-2 animate-pulse"></span>Real-time data</span>
              <span>Last updated: {new Date().toLocaleTimeString()}</span>
            </div>
            <div className="flex items-center space-x-6">
              <span className="text-purple-main">Analytics Dashboard v2.0</span>
              <span className="text-purple-main">PostgreSQL Connected</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Analytics;