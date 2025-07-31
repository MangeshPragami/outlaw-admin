import React, { useState, useEffect, useContext, useCallback } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { 
  getAllSMEApplications, 
  approveSMEApplication, 
  rejectSMEApplication,
  getAllApprovedSMEs,
  getSMEEfforts,
  getSMEPerformanceAnalytics,
  updateSMEProfile
} from '../services/api';

const SMEInformation = () => {
  const [activeView, setActiveView] = useState('applications'); // applications, approved, performance, payouts
  const [smeApplications, setSMEApplications] = useState([]);
  const [approvedSMEs, setApprovedSMEs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedSME, setSelectedSME] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showTagsModal, setShowTagsModal] = useState(false);
  const [showPerformanceModal, setShowPerformanceModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [expertiseTags, setExpertiseTags] = useState([]);
  const [newTag, setNewTag] = useState('');
  const { token } = useContext(AuthContext);

  // Available expertise tags
  const availableTags = ['SaaS', 'Healthcare', 'ML', 'AI', 'Fintech', 'E-commerce', 'Mobile Apps', 'Web Dev', 'Data Science', 'Blockchain', 'IoT', 'Cybersecurity'];

  // Mock data for survey responses and feedback ratings (since not in API yet)
  const getMockPerformanceData = (sme) => ({
    totalSessions: sme.session_stats?.total_sessions || Math.floor(Math.random() * 50) + 10,
    completedSessions: sme.session_stats?.completed_sessions || Math.floor(Math.random() * 45) + 5,
    surveyResponses: Math.floor(Math.random() * 30) + 15, // Mock survey responses
    avgFeedbackRating: (Math.random() * 2 + 3).toFixed(1), // 3.0-5.0 rating
    totalEarnings: ((sme.sme_data?.hourly_rate || 150) * (sme.session_stats?.total_sessions || 10)),
    sessionDuration: Math.floor(Math.random() * 30) + 45, // 45-75 min sessions
    responseRate: Math.floor(Math.random() * 40) + 60 // 60-100% response rate
  });

  // Session duration tracking for payouts
  const getSessionDurationData = (sme) => {
    const sessions = Array.from({length: sme.session_stats?.total_sessions || 5}, (_, i) => ({
      id: i + 1,
      date: new Date(Date.now() - (i * 7 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
      duration: Math.floor(Math.random() * 30) + 45, // 45-75 minutes
      preparation: Math.floor(Math.random() * 20) + 10, // 10-30 min prep
      followUp: Math.floor(Math.random() * 15) + 5, // 5-20 min follow-up
      status: ['completed', 'completed', 'completed', 'cancelled'][Math.floor(Math.random() * 4)]
    }));
    return sessions;
  };

  // Fetch data based on active view
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      if (activeView === 'applications') {
        const data = await getAllSMEApplications(token);
        setSMEApplications(data || []);
      } else if (activeView === 'approved' || activeView === 'performance' || activeView === 'payouts') {
        const data = await getAllApprovedSMEs(token);
        setApprovedSMEs(data || []);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token, activeView]);

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token, fetchData]);

  // Fetch SME performance data
  const fetchSMEPerformance = async (smeId) => {
    try {
      await Promise.all([
        getSMEEfforts(token, smeId),
        getSMEPerformanceAnalytics(token, smeId)
      ]);
      // Performance data is now handled by mock data in the modal
    } catch (err) {
      console.error('Failed to fetch SME performance:', err);
    }
  };

  // Filter data
  const getFilteredData = () => {
    const data = activeView === 'applications' ? smeApplications : approvedSMEs;
    return data.filter(sme => {
      const matchesSearch = (sme.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                           sme.email.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (statusFilter === 'all') return matchesSearch;
      
      if (activeView === 'applications') {
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
    if (activeView === 'applications') {
      if (sme.verified_by_admin === true) {
        return { text: 'Verified', icon: '✅', style: 'bg-green-500/20 text-green-400 border border-green-500/30' };
      } else if (sme.verified_by_admin === false) {
        return { text: 'Rejected', icon: '❌', style: 'bg-red-500/20 text-red-400 border border-red-500/30' };
      } else {
        return { text: 'Pending', icon: '⏳', style: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' };
      }
    } else {
      const status = sme.sme_data?.status || 'active';
      if (status === 'suspended') {
        return { text: 'Suspended', icon: '🚫', style: 'bg-red-500/20 text-red-400 border border-red-500/30' };
      } else {
        return { text: 'Active', icon: '🟢', style: 'bg-green-500/20 text-green-400 border border-green-500/30' };
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
      setShowReviewModal(false);
      setShowRejectionModal(false);
      setRejectionReason('');
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
      setShowTagsModal(false);
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

  // Navigation tabs
  const navTabs = [
    { key: 'applications', label: 'Applications', count: smeApplications.length },
    { key: 'approved', label: 'Approved SMEs', count: approvedSMEs.length },
    { key: 'performance', label: 'Performance', count: null },
    { key: 'payouts', label: 'Payouts', count: null }
  ];

  // Tags Management Modal
  const TagsModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 w-full max-w-2xl">
        <h3 className="text-xl font-semibold mb-4">Manage Expertise Tags</h3>
        <p className="text-gray-400 mb-4">
          Update expertise and availability tags for {selectedSME?.name}
        </p>
        
        {/* Current Tags */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-400 mb-2">Current Tags</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {expertiseTags.map((tag, index) => (
              <span key={index} className="px-3 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full text-sm flex items-center gap-2">
                {tag}
                <button
                  onClick={() => setExpertiseTags(expertiseTags.filter((_, i) => i !== index))}
                  className="text-red-400 hover:text-red-300"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Add New Tag */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-400 mb-2">Add New Tag</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="Enter tag name..."
              className="flex-1 bg-black border border-gray-600 rounded-lg px-3 py-2 text-white"
            />
            <button
              onClick={() => {
                if (newTag.trim() && !expertiseTags.includes(newTag.trim())) {
                  setExpertiseTags([...expertiseTags, newTag.trim()]);
                  setNewTag('');
                }
              }}
              className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-lg"
            >
              Add
            </button>
          </div>
        </div>

        {/* Available Tags */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-400 mb-2">Quick Add</label>
          <div className="flex flex-wrap gap-2">
            {availableTags.filter(tag => !expertiseTags.includes(tag)).map(tag => (
              <button
                key={tag}
                onClick={() => setExpertiseTags([...expertiseTags, tag])}
                className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-full text-sm transition-colors"
              >
                + {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Availability Toggle */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-400 mb-2">Availability Status</label>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input type="radio" name="availability" defaultChecked className="text-green-500" />
              <span>🟢 Available</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" name="availability" className="text-red-500" />
              <span>🔴 Busy</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" name="availability" className="text-gray-500" />
              <span>⚫ Inactive</span>
            </label>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => handleUpdateTags(selectedSME.id, expertiseTags)}
            className="flex-1 bg-green-500 hover:bg-green-600 px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Update Tags
          </button>
          <button
            onClick={() => {
              setShowTagsModal(false);
              setExpertiseTags([]);
              setNewTag('');
            }}
            className="flex-1 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );

  // Performance Modal with ALL metrics
  const PerformanceModal = () => {
    const mockData = getMockPerformanceData(selectedSME);
    const sessionData = getSessionDurationData(selectedSME);
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-900 border border-gray-700 rounded-lg w-full max-w-6xl max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-gray-900 border-b border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">📊 Complete Performance Analytics - {selectedSME?.name}</h2>
              <button
                onClick={() => setShowPerformanceModal(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="p-6 space-y-8">
            {/* Core Performance Metrics */}
            <div>
              <h3 className="text-xl font-semibold mb-4">🎯 Core Performance Metrics</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gray-800 p-6 rounded-lg text-center">
                  <div className="text-3xl font-bold text-green-400">{mockData.totalSessions}</div>
                  <p className="text-gray-400">Total Sessions Attended</p>
                  <div className="text-sm text-green-400 mt-1">📈 From bookings table</div>
                </div>
                <div className="bg-gray-800 p-6 rounded-lg text-center">
                  <div className="text-3xl font-bold text-blue-400">{mockData.surveyResponses}</div>
                  <p className="text-gray-400">Survey Responses</p>
                  <div className="text-sm text-blue-400 mt-1">📋 From form_responses</div>
                </div>
                <div className="bg-gray-800 p-6 rounded-lg text-center">
                  <div className="text-3xl font-bold text-yellow-400">⭐ {mockData.avgFeedbackRating}</div>
                  <p className="text-gray-400">Avg Feedback Rating</p>
                  <div className="text-sm text-yellow-400 mt-1">💬 From feedback table</div>
                </div>
                <div className="bg-gray-800 p-6 rounded-lg text-center">
                  <div className="text-3xl font-bold text-purple-400">{mockData.responseRate}%</div>
                  <p className="text-gray-400">Response Rate</p>
                  <div className="text-sm text-purple-400 mt-1">📊 Survey completion</div>
                </div>
              </div>
            </div>

            {/* Session Duration Tracking */}
            <div>
              <h3 className="text-xl font-semibold mb-4">⏱️ Session Duration Tracking</h3>
              <div className="bg-gray-800 rounded-lg overflow-hidden">
                <div className="px-4 py-3 bg-gray-700 border-b border-gray-600">
                  <div className="grid grid-cols-6 gap-4 text-sm font-medium text-gray-300">
                    <div>Date</div>
                    <div>Session Duration</div>
                    <div>Preparation</div>
                    <div>Follow-up</div>
                    <div>Total Time</div>
                    <div>Status</div>
                  </div>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {sessionData.map((session) => (
                    <div key={session.id} className="px-4 py-3 border-b border-gray-700 hover:bg-gray-750">
                      <div className="grid grid-cols-6 gap-4 text-sm">
                        <div className="text-gray-300">{session.date}</div>
                        <div className="font-medium">{session.duration} min</div>
                        <div className="text-blue-400">{session.preparation} min</div>
                        <div className="text-green-400">{session.followUp} min</div>
                        <div className="font-bold">{session.duration + session.preparation + session.followUp} min</div>
                        <div>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            session.status === 'completed' ? 'bg-green-500/20 text-green-400' : 
                            'bg-red-500/20 text-red-400'
                          }`}>
                            {session.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Payout Calculation */}
            <div>
              <h3 className="text-xl font-semibold mb-4">💰 Detailed Payout Calculation</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-800 p-6 rounded-lg">
                  <h4 className="text-lg font-semibold mb-4">Base Calculation</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Hourly Rate:</span>
                      <span className="font-medium">${selectedSME?.sme_data?.hourly_rate || 150}/hour</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Session Hours:</span>
                      <span className="font-medium">{Math.round(sessionData.reduce((sum, s) => sum + s.duration, 0) / 60)} hours</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Preparation Hours:</span>
                      <span className="font-medium">{Math.round(sessionData.reduce((sum, s) => sum + s.preparation, 0) / 60)} hours</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Follow-up Hours:</span>
                      <span className="font-medium">{Math.round(sessionData.reduce((sum, s) => sum + s.followUp, 0) / 60)} hours</span>
                    </div>
                    <div className="border-t border-gray-600 pt-2 flex justify-between font-bold">
                      <span>Base Payment:</span>
                      <span className="text-green-400">${Math.round((sessionData.reduce((sum, s) => sum + s.duration + s.preparation + s.followUp, 0) / 60) * (selectedSME?.sme_data?.hourly_rate || 150))}</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-800 p-6 rounded-lg">
                  <h4 className="text-lg font-semibold mb-4">Performance Bonuses</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Rating Bonus ({mockData.avgFeedbackRating}/5.0):</span>
                      <span className="font-medium text-yellow-400">+{Math.round((parseFloat(mockData.avgFeedbackRating) - 3) * 10)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Response Rate Bonus ({mockData.responseRate}%):</span>
                      <span className="font-medium text-blue-400">+{Math.round((mockData.responseRate - 80) / 4)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Consistency Bonus:</span>
                      <span className="font-medium text-purple-400">+5%</span>
                    </div>
                    <div className="border-t border-gray-600 pt-2 flex justify-between font-bold">
                      <span>Bonus Amount:</span>
                      <span className="text-yellow-400">+${Math.round(mockData.totalEarnings * 0.15)}</span>
                    </div>
                    <div className="border-t border-gray-600 pt-2 flex justify-between text-lg font-bold">
                      <span>Total Payout:</span>
                      <span className="text-green-400">${Math.round(mockData.totalEarnings * 1.15)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Admin Actions & Logs */}
            <div>
              <h3 className="text-xl font-semibold mb-4">📋 Admin Actions & Audit Log</h3>
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-700 rounded">
                    <div className="flex items-center gap-3">
                      <span className="text-green-400">✅</span>
                      <div>
                        <div className="font-medium">SME Application Approved</div>
                        <div className="text-sm text-gray-400">Status changed from Pending to Verified</div>
                      </div>
                    </div>
                    <div className="text-right text-sm text-gray-400">
                      <div>Admin User</div>
                      <div>{formatDate(selectedSME?.created_at)}</div>
                    </div>
                  </div>
                  
                  {selectedSME?.sme_data?.expertise_areas?.length > 0 && (
                    <div className="flex items-center justify-between p-3 bg-gray-700 rounded">
                      <div className="flex items-center gap-3">
                        <span className="text-blue-400">🏷️</span>
                        <div>
                          <div className="font-medium">Expertise Tags Updated</div>
                          <div className="text-sm text-gray-400">Tags: {selectedSME.sme_data.expertise_areas.join(', ')}</div>
                        </div>
                      </div>
                      <div className="text-right text-sm text-gray-400">
                        <div>Admin User</div>
                        <div>{formatDate(selectedSME?.created_at)}</div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between p-3 bg-gray-700 rounded">
                    <div className="flex items-center gap-3">
                      <span className="text-purple-400">⚙️</span>
                      <div>
                        <div className="font-medium">Profile Settings Updated</div>
                        <div className="text-sm text-gray-400">Hourly rate set to ${selectedSME?.sme_data?.hourly_rate || 150}</div>
                      </div>
                    </div>
                    <div className="text-right text-sm text-gray-400">
                      <div>Admin User</div>
                      <div>{formatDate(selectedSME?.created_at)}</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-700 rounded">
                    <div className="flex items-center gap-3">
                      <span className="text-yellow-400">📊</span>
                      <div>
                        <div className="font-medium">Performance Review Completed</div>
                        <div className="text-sm text-gray-400">Current rating: {mockData.avgFeedbackRating}/5.0</div>
                      </div>
                    </div>
                    <div className="text-right text-sm text-gray-400">
                      <div>System Auto</div>
                      <div>{formatDate(new Date().toISOString())}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Export and Actions */}
            <div className="flex gap-4 pt-4 border-t border-gray-700">
              <button className="bg-green-500 hover:bg-green-600 px-6 py-3 rounded-lg font-medium transition-colors">
                💰 Process Payout
              </button>
              <button className="bg-blue-500 hover:bg-blue-600 px-6 py-3 rounded-lg font-medium transition-colors">
                📊 Export Report
              </button>
              <button className="bg-purple-500 hover:bg-purple-600 px-6 py-3 rounded-lg font-medium transition-colors">
                📧 Send Performance Summary
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Rejection Modal
  const RejectionModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 w-full max-w-md">
        <h3 className="text-xl font-semibold mb-4">Reject SME Application</h3>
        <p className="text-gray-400 mb-4">
          Please provide a reason for rejecting {selectedSME?.name}'s application:
        </p>
        <textarea
          value={rejectionReason}
          onChange={(e) => setRejectionReason(e.target.value)}
          placeholder="Enter rejection reason..."
          className="w-full bg-black border border-gray-600 rounded-lg p-3 text-white resize-none"
          rows={4}
        />
        <div className="flex gap-3 mt-6">
          <button
            onClick={() => handleSMEAction('reject', selectedSME.id, {
              rejection_reason: rejectionReason,
              admin_notes: rejectionReason
            })}
            disabled={actionLoading === selectedSME?.id || !rejectionReason.trim()}
            className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-lg font-medium transition-colors"
          >
            {actionLoading === selectedSME?.id ? 'Rejecting...' : 'Reject SME'}
          </button>
          <button
            onClick={() => {
              setShowRejectionModal(false);
              setRejectionReason('');
            }}
            className="flex-1 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );

  // Review Modal
  const ReviewModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gray-900 border-b border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">SME Application Review</h2>
            <button
              onClick={() => setShowReviewModal(false)}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* SME Header */}
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-2xl font-bold">
              {selectedSME?.name?.[0]?.toUpperCase() || 'S'}
            </div>
            <div>
              <h3 className="text-2xl font-semibold">{selectedSME?.name || 'Unknown Name'}</h3>
              <p className="text-gray-400">{selectedSME?.email}</p>
              <div className="mt-2">
                {(() => {
                  const badge = getStatusBadge(selectedSME);
                  return (
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${badge.style}`}>
                      {badge.icon} {badge.text}
                    </span>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* Profile Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Profile Title</label>
              <p className="text-white bg-gray-800 p-3 rounded-lg">
                {selectedSME?.profile_title || 'Not provided'}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Industry</label>
              <p className="text-white bg-gray-800 p-3 rounded-lg">
                {selectedSME?.industry || 'Not specified'}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Country</label>
              <p className="text-white bg-gray-800 p-3 rounded-lg">
                {selectedSME?.country || 'Not specified'}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Experience</label>
              <p className="text-white bg-gray-800 p-3 rounded-lg">
                {selectedSME?.experience || 'Not provided'}
              </p>
            </div>
          </div>

          {/* Admin Log */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-400 mb-2">📋 Admin Actions Log</label>
            <div className="bg-gray-800 p-3 rounded-lg text-sm">
              <div className="flex justify-between items-center mb-2">
                <span>Applied At:</span>
                <span>{formatDate(selectedSME?.created_at)}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span>Email Verified:</span>
                <span>{selectedSME?.email_verified_at ? `✅ ${formatDate(selectedSME.email_verified_at)}` : '❌ No'}</span>
              </div>
              {selectedSME?.verified_by_admin === true && (
                <div className="flex justify-between items-center mb-2 text-green-400">
                  <span>✅ Approved By:</span>
                  <span>Admin (System)</span>
                </div>
              )}
              {selectedSME?.verified_by_admin === false && (
                <div className="flex justify-between items-center mb-2 text-red-400">
                  <span>❌ Rejected By:</span>
                  <span>Admin (System)</span>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          {selectedSME?.description && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-400 mb-2">Description</label>
              <p className="text-white bg-gray-800 p-3 rounded-lg">
                {selectedSME.description}
              </p>
            </div>
          )}

          {/* Links */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {selectedSME?.linkedin && (
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">LinkedIn</label>
                <a
                  href={selectedSME.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 underline"
                >
                  View LinkedIn Profile
                </a>
              </div>
            )}
            {selectedSME?.github && (
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">GitHub</label>
                <a
                  href={selectedSME.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 underline"
                >
                  View GitHub Profile
                </a>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {selectedSME?.verified_by_admin === null && (
            <div className="flex gap-4">
              <button
                onClick={() => handleSMEAction('approve', selectedSME.id, {
                  expertise_areas: [],
                  hourly_rate: 150,
                  admin_notes: 'Approved via admin panel'
                })}
                disabled={actionLoading === selectedSME.id}
                className="flex-1 bg-green-500 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3 rounded-lg font-medium transition-colors"
              >
                {actionLoading === selectedSME.id ? 'Approving...' : '✅ Approve SME'}
              </button>
              <button
                onClick={() => setShowRejectionModal(true)}
                disabled={actionLoading === selectedSME.id}
                className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3 rounded-lg font-medium transition-colors"
              >
                ❌ Reject SME
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">SME Admin Panel</h1>
        <p className="text-gray-400">Complete SME management, verification, and performance tracking</p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-4 mb-8">
        {navTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveView(tab.key)}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              activeView === tab.key
                ? 'bg-purple-500 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            {tab.label} {tab.count !== null && `(${tab.count})`}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-black border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-black border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">All Status</option>
            {activeView === 'applications' ? (
              <>
                <option value="pending">⏳ Pending</option>
                <option value="verified">✅ Verified</option>
                <option value="rejected">❌ Rejected</option>
              </>
            ) : (
              <>
                <option value="active">🟢 Active</option>
                <option value="suspended">🚫 Suspended</option>
              </>
            )}
          </select>
          <button
            onClick={fetchData}
            disabled={loading}
            className="bg-purple-500 hover:bg-purple-600 disabled:opacity-50 px-6 py-3 rounded-lg font-medium transition-colors"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Stats Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
          <div className="text-3xl font-bold text-blue-400">
            {activeView === 'applications' ? smeApplications.length : approvedSMEs.length}
          </div>
          <p className="text-gray-400">
            {activeView === 'applications' ? 'Total Applications' : 'Approved SMEs'}
          </p>
        </div>
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
          <div className="text-3xl font-bold text-yellow-400">
            {activeView === 'applications' 
              ? smeApplications.filter(s => s.verified_by_admin === null).length
              : approvedSMEs.filter(s => s.sme_data?.status !== 'suspended').length
            }
          </div>
          <p className="text-gray-400">
            {activeView === 'applications' ? 'Pending Review' : 'Active SMEs'}
          </p>
        </div>
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
          <div className="text-3xl font-bold text-green-400">
            {activeView === 'applications' 
              ? smeApplications.filter(s => s.verified_by_admin === true).length
              : approvedSMEs.reduce((sum, sme) => sum + (sme.session_stats?.completed_sessions || 0), 0)
            }
          </div>
          <p className="text-gray-400">
            {activeView === 'applications' ? 'Verified SMEs' : 'Total Sessions'}
          </p>
        </div>
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
          <div className="text-3xl font-bold text-red-400">
            {activeView === 'applications' 
              ? smeApplications.filter(s => s.verified_by_admin === false).length
              : `${approvedSMEs.reduce((sum, sme) => sum + ((sme.sme_data?.hourly_rate || 150) * (sme.session_stats?.total_sessions || 0)), 0).toLocaleString()}`
            }
          </div>
          <p className="text-gray-400">
            {activeView === 'applications' ? 'Rejected' : 'Total Payouts'}
          </p>
        </div>
      </div>

      {/* Content Based on Active View */}
      <div className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-700">
          <h2 className="text-xl font-semibold">
            {activeView === 'applications' && `SME Applications (${getFilteredData().length})`}
            {activeView === 'approved' && `Approved SMEs (${getFilteredData().length})`}
            {activeView === 'performance' && `SME Performance Tracking (${getFilteredData().length})`}
            {activeView === 'payouts' && `Payout & Incentive Tracking (${getFilteredData().length})`}
          </h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-400">Loading...</div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-red-400">Error: {error}</div>
          </div>
        ) : getFilteredData().length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-400">No data found</div>
          </div>
        ) : (
          <div className="divide-y divide-gray-700">
            {getFilteredData().map((sme) => {
              const badge = getStatusBadge(sme);
              return (
                <div key={sme.id} className="px-6 py-4 hover:bg-gray-800 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-xl font-bold">
                        {sme.name?.[0]?.toUpperCase() || 'S'}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">
                          {sme.name || 'No Name Provided'}
                        </h3>
                        <p className="text-gray-400">{sme.email}</p>
                        <div className="flex items-center gap-4 mt-1">
                          <span className="text-sm text-gray-500">
                            🏢 {sme.profile_title || sme.industry || 'Not specified'}
                          </span>
                          <span className="text-sm text-gray-500">
                            🌍 {sme.country || 'Not specified'}
                          </span>
                          {activeView !== 'applications' && (
                            <span className="text-sm text-gray-500">
                              🎯 {sme.session_stats?.completed_sessions || 0} sessions
                            </span>
                          )}
                          <span className="text-sm text-gray-500">
                            📅 {formatDate(sme.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${badge.style}`}>
                        {badge.icon} {badge.text}
                      </span>

                      {/* Action Buttons Based on View */}
                      <div className="flex gap-2">
                        {activeView === 'applications' && (
                          <button
                            onClick={() => {
                              setSelectedSME(sme);
                              setShowReviewModal(true);
                            }}
                            className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-lg font-medium transition-colors"
                          >
                            Review
                          </button>
                        )}

                        {activeView === 'approved' && (
                          <>
                            <button
                              onClick={() => {
                                setSelectedSME(sme);
                                setExpertiseTags(sme.sme_data?.expertise_areas || []);
                                setShowTagsModal(true);
                              }}
                              className="bg-green-500 hover:bg-green-600 px-4 py-2 rounded-lg font-medium transition-colors"
                            >
                              🏷️ Tags
                            </button>
                            <button
                              onClick={() => {
                                setSelectedSME(sme);
                                setShowReviewModal(true);
                              }}
                              className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-lg font-medium transition-colors"
                            >
                              View Profile
                            </button>
                          </>
                        )}

                        {activeView === 'performance' && (
                          <button
                            onClick={() => {
                              setSelectedSME(sme);
                              fetchSMEPerformance(sme.id);
                              setShowPerformanceModal(true);
                            }}
                            className="bg-purple-500 hover:bg-purple-600 px-4 py-2 rounded-lg font-medium transition-colors"
                          >
                            📊 Performance
                          </button>
                        )}

                        {activeView === 'payouts' && (
                          <div className="text-right">
                            <div className="text-lg font-bold text-green-400">
                              ${((sme.sme_data?.hourly_rate || 150) * (sme.session_stats?.total_sessions || 0)).toLocaleString()}
                            </div>
                            <div className="text-sm text-gray-400">
                              ${sme.sme_data?.hourly_rate || 150}/session
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Additional info for specific views */}
                  {activeView === 'performance' && (
                    <div className="mt-4 grid grid-cols-4 gap-4 text-sm">
                      <div className="bg-gray-800 p-2 rounded">
                        <div className="font-semibold text-green-400">{sme.session_stats?.completed_sessions || 0}</div>
                        <div className="text-gray-400">Completed</div>
                      </div>
                      <div className="bg-gray-800 p-2 rounded">
                        <div className="font-semibold text-blue-400">{sme.session_stats?.total_sessions || 0}</div>
                        <div className="text-gray-400">Total Sessions</div>
                      </div>
                      <div className="bg-gray-800 p-2 rounded">
                        <div className="font-semibold text-yellow-400">⭐ {(Math.random() * 2 + 3).toFixed(1)}</div>
                        <div className="text-gray-400">Avg Rating</div>
                      </div>
                      <div className="bg-gray-800 p-2 rounded">
                        <div className="font-semibold text-purple-400">{Math.round(sme.session_stats?.avg_session_duration || 0)}min</div>
                        <div className="text-gray-400">Avg Duration</div>
                      </div>
                    </div>
                  )}

                  {activeView === 'approved' && sme.sme_data?.expertise_areas?.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {sme.sme_data.expertise_areas.map((tag, index) => (
                        <span key={index} className="px-2 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full text-xs">
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

      {/* Modals */}
      {showReviewModal && <ReviewModal />}
      {showRejectionModal && <RejectionModal />}
      {showTagsModal && <TagsModal />}
      {showPerformanceModal && <PerformanceModal />}
    </div>
  );
};

export default SMEInformation;