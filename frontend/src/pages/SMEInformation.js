import React, { useState, useEffect, useContext, useCallback } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { 
  getAllSMEApplications, 
  approveSMEApplication, 
  rejectSMEApplication,
  getAllApprovedSMEs,
  getSMEEfforts,
  updateSMEProfile
} from '../services/api';

const SMEInformation = () => {
  const [currentView, setCurrentView] = useState('main'); // main, application-review, sme-profile, tag-management
  const [activeTab, setActiveTab] = useState('applications'); // applications, approved
  const [smeApplications, setSMEApplications] = useState([]);
  const [approvedSMEs, setApprovedSMEs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedSME, setSelectedSME] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [expertiseTags, setExpertiseTags] = useState([]);
  const [newTag, setNewTag] = useState('');
  const { token } = useContext(AuthContext);

  // Available expertise tags
  const availableTags = ['SaaS', 'Healthcare', 'ML', 'AI', 'Fintech', 'E-commerce', 'Mobile Apps', 'Web Dev', 'Data Science', 'Blockchain', 'IoT', 'Cybersecurity'];

  // Fetch data based on active tab
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      if (activeTab === 'applications') {
        const data = await getAllSMEApplications(token);
        setSMEApplications(data || []);
      } else if (activeTab === 'approved') {
        const data = await getAllApprovedSMEs(token);
        setApprovedSMEs(data || []);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token, activeTab]);

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token, fetchData]);

  // Filter data
  const getFilteredData = () => {
    const data = activeTab === 'applications' ? smeApplications : approvedSMEs;
    return data.filter(sme => {
      const matchesSearch = (sme.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                           sme.email.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (statusFilter === 'all') return matchesSearch;
      
      if (activeTab === 'applications') {
        if (statusFilter === 'pending') return matchesSearch && sme.verified_by_admin === null;
        if (statusFilter === 'verified') return matchesSearch && sme.verified_by_admin === true;
        if (statusFilter === 'rejected') return matchesSearch && sme.verified_by_admin === false;
      } else {
        if (statusFilter === 'active') return matchesSearch && sme.sme_data?.status !== 'suspended';
        if (statusFilter === 'suspended') return matchesSearch && sme.sme_data?.status === 'suspended';
      }
      
      return matchesSearch;
    });
  };

  // Get status badge
  const getStatusBadge = (sme) => {
    if (activeTab === 'applications') {
      if (sme.verified_by_admin === true) {
        return { text: 'Verified', style: 'px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-sm font-medium' };
      } else if (sme.verified_by_admin === false) {
        return { text: 'Rejected', style: 'px-3 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded-full text-sm font-medium' };
      } else {
        return { text: 'Pending', style: 'px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full text-sm font-medium' };
      }
    } else {
      const status = sme.sme_data?.status || 'active';
      if (status === 'suspended') {
        return { text: 'Suspended', style: 'px-3 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded-full text-sm font-medium' };
      } else {
        return { text: 'Active', style: 'px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-sm font-medium' };
      }
    }
  };

  // Handle SME actions
  const handleSMEAction = async (action, smeId, data = {}) => {
    setActionLoading(smeId);
    try {
      let result;
      switch (action) {
        case 'approve':
          result = await approveSMEApplication(token, smeId, data);
          await fetchData();
          break;
        case 'reject':
          result = await rejectSMEApplication(token, smeId, data);
          await fetchData();
          break;
        default:
          return;
      }
      alert(result.message || 'Action completed successfully');
      setCurrentView('main');
    } catch (err) {
      alert('Action failed: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  // Handle update SME tags
  const handleUpdateTags = async (smeId, tags) => {
    try {
      await updateSMEProfile(token, smeId, {
        expertise_areas: tags,
        specializations: tags
      });
      await fetchData();
      setCurrentView('main');
      alert('Tags updated successfully!');
    } catch (err) {
      alert('Failed to update tags: ' + err.message);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Navigation
  const goBack = () => {
    setCurrentView('main');
    setSelectedSME(null);
    setExpertiseTags([]);
    setNewTag('');
    setRejectionReason('');
  };

  // Navigation tabs
  const navTabs = [
    { key: 'applications', label: 'Applications', count: smeApplications.length },
    { key: 'approved', label: 'Approved SMEs', count: approvedSMEs.length }
  ];

  // Main Dashboard View
  if (currentView === 'main') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white p-8">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg">
              <div className="w-8 h-8 bg-white rounded-lg"></div>
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                SME Management
              </h1>
              <p className="text-gray-400 text-base mt-2">Review and manage subject matter expert applications</p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-2 mb-10">
          {navTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-8 py-4 rounded-2xl font-bold transition-all duration-300 border-2 relative overflow-hidden ${
                activeTab === tab.key
                  ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white border-transparent shadow-lg scale-105'
                  : 'bg-gray-800/50 text-white hover:bg-gray-700/70 border-gray-700 hover:border-purple-500/50 hover:scale-102'
              }`}
            >
              <span className="relative z-10 text-base">
                {tab.label} 
                <span className={`ml-2 px-2 py-1 rounded-full text-sm ${
                  activeTab === tab.key ? 'bg-white/20 text-white' : 'bg-purple-500/20 text-purple-300'
                }`}>
                  {tab.count}
                </span>
              </span>
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-gray-800/30 backdrop-blur border border-gray-700/50 rounded-2xl p-8 mb-10 shadow-xl">
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-purple-300 mb-2">Search SMEs</label>
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-800/70 border border-gray-600 rounded-xl px-6 py-4 text-white focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 transition-all"
              />
            </div>
            <div className="w-full lg:w-64">
              <label className="block text-sm font-semibold text-purple-300 mb-2">Filter Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-gray-800/70 border border-gray-600 rounded-xl px-6 py-4 text-white focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 transition-all"
              >
                <option value="all">All Status</option>
                {activeTab === 'applications' ? (
                  <>
                    <option value="pending">Pending Review</option>
                    <option value="verified">Verified</option>
                    <option value="rejected">Rejected</option>
                  </>
                ) : (
                  <>
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                  </>
                )}
              </select>
            </div>
          </div>
        </div>

        {/* Stats Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/20 rounded-2xl p-8 hover:scale-105 transition-all">
            <div className="text-3xl font-bold text-blue-400 mb-2">
              {activeTab === 'applications' ? smeApplications.length : approvedSMEs.length}
            </div>
            <p className="text-blue-300 font-medium">
              {activeTab === 'applications' ? 'Total Applications' : 'Approved SMEs'}
            </p>
          </div>
          
          <div className="bg-gradient-to-br from-amber-500/10 to-amber-600/10 border border-amber-500/20 rounded-2xl p-8 hover:scale-105 transition-all">
            <div className="text-3xl font-bold text-amber-400 mb-2">
              {activeTab === 'applications' 
                ? smeApplications.filter(s => s.verified_by_admin === null).length
                : approvedSMEs.filter(s => s.sme_data?.status !== 'suspended').length
              }
            </div>
            <p className="text-amber-300 font-medium">
              {activeTab === 'applications' ? 'Pending Review' : 'Active SMEs'}
            </p>
          </div>
          
          <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/10 border border-emerald-500/20 rounded-2xl p-8 hover:scale-105 transition-all">
            <div className="text-3xl font-bold text-emerald-400 mb-2">
              {activeTab === 'applications' 
                ? smeApplications.filter(s => s.verified_by_admin === true).length
                : approvedSMEs.reduce((sum, sme) => sum + (sme.session_stats?.completed_sessions || 0), 0)
              }
            </div>
            <p className="text-emerald-300 font-medium">
              {activeTab === 'applications' ? 'Verified SMEs' : 'Completed Sessions'}
            </p>
          </div>
          
          <div className="bg-gradient-to-br from-red-500/10 to-red-600/10 border border-red-500/20 rounded-2xl p-8 hover:scale-105 transition-all">
            <div className="text-3xl font-bold text-red-400 mb-2">
              {activeTab === 'applications' 
                ? smeApplications.filter(s => s.verified_by_admin === false).length
                : approvedSMEs.reduce((sum, sme) => sum + (sme.session_stats?.total_sessions || 0), 0)
              }
            </div>
            <p className="text-red-300 font-medium">
              {activeTab === 'applications' ? 'Rejected' : 'Total Sessions'}
            </p>
          </div>
        </div>

        {/* Content List */}
        <div className="bg-gray-800/30 backdrop-blur border border-gray-700/50 rounded-2xl overflow-hidden shadow-xl">
          <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 px-8 py-6 border-b border-gray-700/50">
            <h2 className="text-2xl font-bold text-white">
              {activeTab === 'applications' && `SME Applications (${getFilteredData().length})`}
              {activeTab === 'approved' && `Approved SMEs (${getFilteredData().length})`}
            </h2>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin"></div>
                <span className="text-gray-400">Loading SME data...</span>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="text-red-400 font-medium">Error: {error}</div>
              </div>
            </div>
          ) : getFilteredData().length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="text-gray-400">No SMEs found</div>
                <p className="text-gray-500 mt-2">Try adjusting your search or filters</p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-700/50">
              {getFilteredData().map((sme) => {
                const badge = getStatusBadge(sme);
                return (
                  <div key={sme.id} className="px-8 py-6 hover:bg-gray-700/30 transition-all duration-300 group">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center text-2xl font-bold shadow-lg group-hover:scale-110 transition-transform">
                          {sme.name?.[0]?.toUpperCase() || 'S'}
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-white mb-1">
                            {sme.name || 'No Name Provided'}
                          </h3>
                          <p className="text-purple-300 font-medium mb-2">{sme.email}</p>
                          <div className="flex items-center gap-6">
                            <span className="text-sm text-gray-400">
                              {sme.profile_title || sme.industry || 'Not specified'}
                            </span>
                            <span className="text-sm text-gray-400">
                              {sme.country || 'Not specified'}
                            </span>
                            {activeTab === 'approved' && (
                              <span className="text-sm text-gray-400">
                                {sme.session_stats?.completed_sessions || 0} sessions
                              </span>
                            )}
                            <span className="text-sm text-gray-400">
                              {formatDate(sme.created_at)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <span className={badge.style}>
                          {badge.text}
                        </span>

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                          {activeTab === 'applications' && (
                            <button
                              onClick={() => {
                                setSelectedSME(sme);
                                setCurrentView('application-review');
                              }}
                              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 px-6 py-3 rounded-xl font-semibold transition-all hover:scale-105 shadow-lg"
                            >
                              Review
                            </button>
                          )}

                          {activeTab === 'approved' && (
                            <>
                              <button
                                onClick={() => {
                                  setSelectedSME(sme);
                                  setExpertiseTags(sme.sme_data?.expertise_areas || []);
                                  setCurrentView('tag-management');
                                }}
                                className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 px-6 py-3 rounded-xl font-semibold transition-all hover:scale-105 shadow-lg"
                              >
                                Manage Tags
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedSME(sme);
                                  setCurrentView('sme-profile');
                                }}
                                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 px-6 py-3 rounded-xl font-semibold transition-all hover:scale-105 shadow-lg"
                              >
                                View Profile
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Session stats for approved SMEs */}
                    {activeTab === 'approved' && (
                      <div className="mt-6 grid grid-cols-3 gap-4">
                        <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/10 border border-emerald-500/20 rounded-xl p-4 text-center">
                          <div className="text-2xl font-bold text-emerald-400">{sme.session_stats?.completed_sessions || 0}</div>
                          <div className="text-emerald-300 text-sm font-medium">Completed</div>
                        </div>
                        <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/20 rounded-xl p-4 text-center">
                          <div className="text-2xl font-bold text-blue-400">{sme.session_stats?.total_sessions || 0}</div>
                          <div className="text-blue-300 text-sm font-medium">Total Sessions</div>
                        </div>
                        <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/20 rounded-xl p-4 text-center">
                          <div className="text-2xl font-bold text-purple-400">{Math.round(sme.session_stats?.avg_session_duration || 0)}min</div>
                          <div className="text-purple-300 text-sm font-medium">Avg Duration</div>
                        </div>
                      </div>
                    )}

                    {/* Expertise tags */}
                    {activeTab === 'approved' && sme.sme_data?.expertise_areas?.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {sme.sme_data.expertise_areas.map((tag, index) => (
                          <span key={index} className="px-3 py-1.5 bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-300 border border-blue-500/30 rounded-full text-sm font-medium">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Application Review View
  if (currentView === 'application-review') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white p-8">
        {/* Header with Back Button */}
        <div className="mb-8">
          <button
            onClick={goBack}
            className="flex items-center gap-3 text-gray-400 hover:text-white mb-6 transition-all"
          >
            <div className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center">←</div>
            Back to SME Management
          </button>
          
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center text-3xl font-bold shadow-lg">
              {selectedSME?.name?.[0]?.toUpperCase() || 'S'}
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">{selectedSME?.name || 'Unknown Name'}</h1>
              <p className="text-purple-300 text-xl">{selectedSME?.email}</p>
              <div className="mt-3">
                {(() => {
                  const badge = getStatusBadge(selectedSME);
                  return <span className={badge.style}>{badge.text}</span>;
                })()}
              </div>
            </div>
          </div>
        </div>

        {/* Profile Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6">
            <label className="block text-sm font-semibold text-purple-300 mb-3">Profile Title</label>
            <p className="text-white text-lg">{selectedSME?.profile_title || 'Not provided'}</p>
          </div>
          <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6">
            <label className="block text-sm font-semibold text-purple-300 mb-3">Industry</label>
            <p className="text-white text-lg">{selectedSME?.industry || 'Not specified'}</p>
          </div>
          <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6">
            <label className="block text-sm font-semibold text-purple-300 mb-3">Country</label>
            <p className="text-white text-lg">{selectedSME?.country || 'Not specified'}</p>
          </div>
          <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6">
            <label className="block text-sm font-semibold text-purple-300 mb-3">Application Date</label>
            <p className="text-white text-lg">{formatDate(selectedSME?.created_at)}</p>
          </div>
        </div>

        {/* Experience */}
        {selectedSME?.experience && (
          <div className="mb-8">
            <label className="block text-sm font-semibold text-purple-300 mb-3">Professional Experience</label>
            <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6">
              <p className="text-white leading-relaxed whitespace-pre-wrap">{selectedSME.experience}</p>
            </div>
          </div>
        )}

        {/* External Links */}
        {(selectedSME?.linkedin || selectedSME?.github || selectedSME?.cv_url) && (
          <div className="mb-8">
            <label className="block text-sm font-semibold text-purple-300 mb-3">External Links</label>
            <div className="flex flex-wrap gap-4">
              {selectedSME?.linkedin && (
                <a
                  href={selectedSME.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-blue-600/20 border border-blue-500/30 px-6 py-3 rounded-xl text-blue-300 hover:bg-blue-600/30 transition-all"
                >
                  LinkedIn Profile
                </a>
              )}
              {selectedSME?.github && (
                <a
                  href={selectedSME.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-gray-600/20 border border-gray-500/30 px-6 py-3 rounded-xl text-gray-300 hover:bg-gray-600/30 transition-all"
                >
                  GitHub Profile
                </a>
              )}
              {selectedSME?.cv_url && (
                <a
                  href={selectedSME.cv_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-green-600/20 border border-green-500/30 px-6 py-3 rounded-xl text-green-300 hover:bg-green-600/30 transition-all"
                >
                  CV/Resume
                </a>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {selectedSME?.verified_by_admin === null && (
          <div className="flex gap-6">
            <button
              onClick={() => handleSMEAction('approve', selectedSME.id, {
                expertise_areas: [],
                hourly_rate: 150,
                admin_notes: 'Approved via admin panel'
              })}
              disabled={actionLoading === selectedSME.id}
              className="flex-1 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 disabled:opacity-50 disabled:cursor-not-allowed px-8 py-4 rounded-xl font-semibold transition-all hover:scale-105"
            >
              {actionLoading === selectedSME.id ? 'Approving...' : 'Approve SME'}
            </button>
            <button
              onClick={() => setCurrentView('rejection-form')}
              disabled={actionLoading === selectedSME.id}
              className="flex-1 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed px-8 py-4 rounded-xl font-semibold transition-all hover:scale-105"
            >
              Reject Application
            </button>
          </div>
        )}
      </div>
    );
  }

  // Rejection Form View
  if (currentView === 'rejection-form') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white p-8">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => setCurrentView('application-review')}
            className="flex items-center gap-3 text-gray-400 hover:text-white mb-8 transition-all"
          >
            <div className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center">←</div>
            Back to Review
          </button>
          
          <div className="bg-gray-800/50 border border-red-500/30 rounded-2xl p-8">
            <h1 className="text-3xl font-bold text-white mb-6">Reject SME Application</h1>
            <p className="text-gray-400 mb-6 text-lg">
              Provide a detailed reason for rejecting {selectedSME?.name}'s application
            </p>
            
            <div className="mb-8">
              <label className="block text-sm font-semibold text-red-300 mb-3">Rejection Reason</label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter detailed rejection reason..."
                className="w-full bg-gray-800 border border-gray-600 rounded-xl p-6 text-white resize-none focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all text-lg"
                rows={6}
              />
            </div>
            
            <div className="flex gap-4">
              <button
                onClick={() => handleSMEAction('reject', selectedSME.id, {
                  rejection_reason: rejectionReason,
                  admin_notes: rejectionReason
                })}
                disabled={actionLoading === selectedSME?.id || !rejectionReason.trim()}
                className="flex-1 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed px-8 py-4 rounded-xl font-semibold transition-all"
              >
                {actionLoading === selectedSME?.id ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
              <button
                onClick={() => setCurrentView('application-review')}
                className="flex-1 bg-gray-700 hover:bg-gray-600 px-8 py-4 rounded-xl font-semibold transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // SME Profile View
  if (currentView === 'sme-profile') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white p-8">
        <div className="max-w-6xl mx-auto">
          <button
            onClick={goBack}
            className="flex items-center gap-3 text-gray-400 hover:text-white mb-8 transition-all"
          >
            <div className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center">←</div>
            Back to SME Management
          </button>
          
          {/* Profile Header */}
          <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-purple-500/30 rounded-2xl p-8 mb-8">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center text-3xl font-bold shadow-lg">
                {selectedSME?.name?.[0]?.toUpperCase() || 'S'}
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">{selectedSME?.name || 'Unknown Name'}</h1>
                <p className="text-purple-300 text-xl mb-3">{selectedSME?.email}</p>
                {(() => {
                  const badge = getStatusBadge(selectedSME);
                  return <span className={badge.style}>{badge.text}</span>;
                })()}
              </div>
            </div>
          </div>

          {/* Session Performance */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-6">Session Performance</h2>
            <div className="grid grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/20 rounded-2xl p-8 text-center">
                <div className="text-4xl font-bold text-blue-400 mb-3">
                  {selectedSME?.session_stats?.total_sessions || 0}
                </div>
                <p className="text-blue-300 font-semibold text-lg">Total Sessions</p>
              </div>
              <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/10 border border-emerald-500/20 rounded-2xl p-8 text-center">
                <div className="text-4xl font-bold text-emerald-400 mb-3">
                  {selectedSME?.session_stats?.completed_sessions || 0}
                </div>
                <p className="text-emerald-300 font-semibold text-lg">Completed</p>
              </div>
              <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/20 rounded-2xl p-8 text-center">
                <div className="text-4xl font-bold text-purple-400 mb-3">
                  {Math.round(selectedSME?.session_stats?.avg_session_duration || 0)}min
                </div>
                <p className="text-purple-300 font-semibold text-lg">Avg Duration</p>
              </div>
            </div>
          </div>

          {/* Profile Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6">
              <label className="block text-sm font-semibold text-purple-300 mb-3">Profile Title</label>
              <p className="text-white text-lg">{selectedSME?.profile_title || 'Not provided'}</p>
            </div>
            <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6">
              <label className="block text-sm font-semibold text-purple-300 mb-3">Industry</label>
              <p className="text-white text-lg">{selectedSME?.industry || 'Not specified'}</p>
            </div>
            <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6">
              <label className="block text-sm font-semibold text-purple-300 mb-3">Country</label>
              <p className="text-white text-lg">{selectedSME?.country || 'Not specified'}</p>
            </div>
            <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6">
              <label className="block text-sm font-semibold text-purple-300 mb-3">Join Date</label>
              <p className="text-white text-lg">{formatDate(selectedSME?.created_at)}</p>
            </div>
          </div>

          {/* Expertise Tags */}
          {selectedSME?.sme_data?.expertise_areas?.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">Expertise Areas</h2>
              <div className="flex flex-wrap gap-3">
                {selectedSME.sme_data.expertise_areas.map((tag, index) => (
                  <span key={index} className="px-4 py-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-300 border border-blue-500/30 rounded-xl font-medium">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* External Links */}
          {(selectedSME?.linkedin || selectedSME?.github || selectedSME?.cv_url) && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">External Links</h2>
              <div className="flex flex-wrap gap-4">
                {selectedSME?.linkedin && (
                  <a
                    href={selectedSME.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-blue-600/20 border border-blue-500/30 px-6 py-3 rounded-xl text-blue-300 hover:bg-blue-600/30 transition-all"
                  >
                    LinkedIn Profile
                  </a>
                )}
                {selectedSME?.github && (
                  <a
                    href={selectedSME.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-gray-600/20 border border-gray-500/30 px-6 py-3 rounded-xl text-gray-300 hover:bg-gray-600/30 transition-all"
                  >
                    GitHub Profile
                  </a>
                )}
                {selectedSME?.cv_url && (
                  <a
                    href={selectedSME.cv_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-green-600/20 border border-green-500/30 px-6 py-3 rounded-xl text-green-300 hover:bg-green-600/30 transition-all"
                  >
                    CV/Resume
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Tag Management View
  if (currentView === 'tag-management') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white p-8">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={goBack}
            className="flex items-center gap-3 text-gray-400 hover:text-white mb-8 transition-all"
          >
            <div className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center">←</div>
            Back to SME Management
          </button>
          
          <div className="bg-gray-800/50 border border-purple-500/30 rounded-2xl p-8">
            <h1 className="text-3xl font-bold text-white mb-6">Manage Expertise Tags</h1>
            <p className="text-gray-400 mb-8 text-lg">Update expertise tags for {selectedSME?.name}</p>
            
            {/* Current Tags */}
            <div className="mb-8">
              <label className="block text-sm font-semibold text-purple-300 mb-4">Current Tags</label>
              <div className="min-h-[60px] p-6 bg-gray-800/50 rounded-xl border border-gray-700">
                {expertiseTags.length === 0 ? (
                  <span className="text-gray-500 italic">No tags assigned</span>
                ) : (
                  <div className="flex flex-wrap gap-3">
                    {expertiseTags.map((tag, index) => (
                      <span key={index} className="px-4 py-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-300 border border-blue-500/30 rounded-xl font-medium flex items-center gap-3">
                        {tag}
                        <button
                          onClick={() => setExpertiseTags(expertiseTags.filter((_, i) => i !== index))}
                          className="text-red-400 hover:text-red-300 font-bold"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Add New Tag */}
            <div className="mb-8">
              <label className="block text-sm font-semibold text-purple-300 mb-4">Add New Tag</label>
              <div className="flex gap-4">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Enter tag name..."
                  className="flex-1 bg-gray-800 border border-gray-600 rounded-xl px-6 py-4 text-white text-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                />
                <button
                  onClick={() => {
                    if (newTag.trim() && !expertiseTags.includes(newTag.trim())) {
                      setExpertiseTags([...expertiseTags, newTag.trim()]);
                      setNewTag('');
                    }
                  }}
                  className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 px-8 py-4 rounded-xl font-semibold transition-all"
                >
                  Add Tag
                </button>
              </div>
            </div>

            {/* Available Tags */}
            <div className="mb-10">
              <label className="block text-sm font-semibold text-purple-300 mb-4">Quick Add</label>
              <div className="flex flex-wrap gap-3">
                {availableTags.filter(tag => !expertiseTags.includes(tag)).map(tag => (
                  <button
                    key={tag}
                    onClick={() => setExpertiseTags([...expertiseTags, tag])}
                    className="px-4 py-2 bg-gray-700/70 hover:bg-gray-600 border border-gray-600 hover:border-purple-500/50 rounded-xl font-medium transition-all hover:scale-105"
                  >
                    + {tag}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-6">
              <button
                onClick={() => handleUpdateTags(selectedSME.id, expertiseTags)}
                className="flex-1 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 px-8 py-4 rounded-xl font-semibold transition-all hover:scale-105"
              >
                Update Tags
              </button>
              <button
                onClick={goBack}
                className="flex-1 bg-gray-700 hover:bg-gray-600 px-8 py-4 rounded-xl font-semibold transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default SMEInformation;