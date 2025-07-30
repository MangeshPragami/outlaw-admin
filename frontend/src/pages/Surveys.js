// Create new file: src/pages/Surveys.js
import React, { useState, useEffect, useContext, useCallback } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import SurveyFormViewer from '../components/SurveyFormViewer';
import { 
  getAllSurveys, 
  getSurveyById, 
  createSurvey, 
  updateSurvey, 
  deleteSurvey,
  startSurvey,
  stopSurvey,
  getSurveyAnalytics,
  getAllIdeas 
} from '../services/api';

const Surveys = () => {
  const [surveys, setSurveys] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [ideas, setIdeas] = useState([]);
  const [selectedSurvey, setSelectedSurvey] = useState(null);
  const [surveyDetails, setSurveyDetails] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [viewerFormUrl, setViewerFormUrl] = useState('');
  const [currentView, setCurrentView] = useState('list'); // 'list', 'details', 'formViewer'
  const [loading, setLoading] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const { token } = useContext(AuthContext);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [surveysData, analyticsData, ideasData] = await Promise.all([
        getAllSurveys(token),
        getSurveyAnalytics(token),
        getAllIdeas(token)
      ]);
      setSurveys(surveysData);
      setAnalytics(analyticsData);
      setIdeas(ideasData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fetchSurveyDetails = useCallback(async (surveyId) => {
    setDetailsLoading(true);
    try {
      const details = await getSurveyById(token, surveyId);
      setSurveyDetails(details);
    } catch (err) {
      setError(err.message);
    } finally {
      setDetailsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (selectedSurvey) {
      fetchSurveyDetails(selectedSurvey.id);
    }
  }, [selectedSurvey, fetchSurveyDetails]);

  const handleAction = async (action, surveyId, data = null) => {
    setActionLoading(surveyId);
    try {
      let result;
      switch (action) {
        case 'start':
          result = await startSurvey(token, surveyId, data?.duration);
          break;
        case 'stop':
          result = await stopSurvey(token, surveyId);
          break;
        case 'delete':
          if (window.confirm('Are you sure you want to delete this survey? This will also delete all responses.')) {
            result = await deleteSurvey(token, surveyId);
            if (selectedSurvey?.id === surveyId) {
              setSelectedSurvey(null);
              setSurveyDetails(null);
              setCurrentView('list');
            }
          } else {
            return;
          }
          break;
        default:
          return;
      }
      
      await fetchData();
      alert(result.message);
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      'Active': { backgroundColor: '#d4edda', color: '#155724' },
      'Completed': { backgroundColor: '#cce5ff', color: '#004085' },
      'Draft': { backgroundColor: '#fff3cd', color: '#856404' },
      'Scheduled': { backgroundColor: '#e2e3e5', color: '#383d41' }
    };
    
    return {
      padding: '4px 12px',
      borderRadius: '12px',
      fontSize: '12px',
      fontWeight: '600',
      textTransform: 'uppercase',
      ...(styles[status] || styles['Draft'])
    };
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric', 
      hour: '2-digit', minute: '2-digit'
    });
  };

  const filteredSurveys = surveys.filter(survey => {
    const matchesSearch = survey.idea_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          survey.creator_email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || survey.survey_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Create Survey Form Component
  const CreateSurveyForm = () => {
    const [formData, setFormData] = useState({
      idea_id: '',
      form_url: '',
      start_time: '',
      end_time: ''
    });
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
      e.preventDefault();
      setSubmitting(true);
      try {
        const result = await createSurvey(token, formData);
        alert(result.message);
        setShowCreateForm(false);
        fetchData();
      } catch (err) {
        alert(err.message);
      } finally {
        setSubmitting(false);
      }
    };

    return (
      <div style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0, 
        backgroundColor: 'rgba(0,0,0,0.5)', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        zIndex: 1000
      }}>
        <div style={{ 
          backgroundColor: 'white', 
          padding: '24px', 
          borderRadius: '8px', 
          width: '500px',
          maxHeight: '80vh',
          overflow: 'auto'
        }}>
          <h3 style={{ marginTop: 0 }}>Create New Survey</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600' }}>
                Select Idea/Study *
              </label>
              <select
                value={formData.idea_id}
                onChange={(e) => setFormData(prev => ({...prev, idea_id: e.target.value}))}
                required
                style={{ 
                  width: '100%', 
                  padding: '8px', 
                  border: '1px solid #ced4da', 
                  borderRadius: '4px' 
                }}
              >
                <option value="">Choose an idea...</option>
                {ideas.filter(idea => !surveys.some(s => s.idea_id === idea.id)).map(idea => (
                  <option key={idea.id} value={idea.id}>
                    {idea.name} - {idea.targeted_audience}
                  </option>
                ))}
              </select>
              <small style={{ color: '#6c757d' }}>Only ideas without existing surveys are shown</small>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600' }}>
                Survey Form URL *
              </label>
              <input
                type="url"
                value={formData.form_url}
                onChange={(e) => setFormData(prev => ({...prev, form_url: e.target.value}))}
                placeholder="https://forms.google.com/... or https://typeform.com/..."
                required
                style={{ 
                  width: '100%', 
                  padding: '8px', 
                  border: '1px solid #ced4da', 
                  borderRadius: '4px' 
                }}
              />
              <small style={{ color: '#6c757d' }}>Link to your external survey form</small>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600' }}>
                Start Time (Optional)
              </label>
              <input
                type="datetime-local"
                value={formData.start_time}
                onChange={(e) => setFormData(prev => ({...prev, start_time: e.target.value}))}
                style={{ 
                  width: '100%', 
                  padding: '8px', 
                  border: '1px solid #ced4da', 
                  borderRadius: '4px' 
                }}
              />
              <small style={{ color: '#6c757d' }}>Leave empty to start manually later</small>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600' }}>
                End Time (Optional)
              </label>
              <input
                type="datetime-local"
                value={formData.end_time}
                onChange={(e) => setFormData(prev => ({...prev, end_time: e.target.value}))}
                style={{ 
                  width: '100%', 
                  padding: '8px', 
                  border: '1px solid #ced4da', 
                  borderRadius: '4px' 
                }}
              />
              <small style={{ color: '#6c757d' }}>Leave empty for indefinite duration</small>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                disabled={submitting}
                style={{ 
                  padding: '8px 16px', 
                  backgroundColor: '#6c757d', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                style={{ 
                  padding: '8px 16px', 
                  backgroundColor: '#007bff', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                {submitting ? 'Creating...' : 'Create Survey'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Edit Survey Form Component
  const EditSurveyForm = () => {
    const [formData, setFormData] = useState({
      form_url: selectedSurvey?.form_url || '',
      start_time: selectedSurvey?.start_time ? selectedSurvey.start_time.slice(0, 16) : '',
      end_time: selectedSurvey?.end_time ? selectedSurvey.end_time.slice(0, 16) : ''
    });
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
      e.preventDefault();
      setSubmitting(true);
      try {
        const result = await updateSurvey(token, selectedSurvey.id, formData);
        alert(result.message);
        setShowEditForm(false);
        await fetchData();
        // Update selected survey
        const updatedSurvey = surveys.find(s => s.id === selectedSurvey.id);
        if (updatedSurvey) setSelectedSurvey(updatedSurvey);
      } catch (err) {
        alert(err.message);
      } finally {
        setSubmitting(false);
      }
    };

    return (
      <div style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0, 
        backgroundColor: 'rgba(0,0,0,0.5)', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        zIndex: 1000
      }}>
        <div style={{ 
          backgroundColor: 'white', 
          padding: '24px', 
          borderRadius: '8px', 
          width: '500px',
          maxHeight: '80vh',
          overflow: 'auto'
        }}>
          <h3 style={{ marginTop: 0 }}>Edit Survey</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600' }}>
                Survey Form URL *
              </label>
              <input
                type="url"
                value={formData.form_url}
                onChange={(e) => setFormData(prev => ({...prev, form_url: e.target.value}))}
                required
                style={{ 
                  width: '100%', 
                  padding: '8px', 
                  border: '1px solid #ced4da', 
                  borderRadius: '4px' 
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600' }}>
                Start Time
              </label>
              <input
                type="datetime-local"
                value={formData.start_time}
                onChange={(e) => setFormData(prev => ({...prev, start_time: e.target.value}))}
                style={{ 
                  width: '100%', 
                  padding: '8px', 
                  border: '1px solid #ced4da', 
                  borderRadius: '4px' 
                }}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600' }}>
                End Time
              </label>
              <input
                type="datetime-local"
                value={formData.end_time}
                onChange={(e) => setFormData(prev => ({...prev, end_time: e.target.value}))}
                style={{ 
                  width: '100%', 
                  padding: '8px', 
                  border: '1px solid #ced4da', 
                  borderRadius: '4px' 
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setShowEditForm(false)}
                disabled={submitting}
                style={{ 
                  padding: '8px 16px', 
                  backgroundColor: '#6c757d', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                style={{ 
                  padding: '8px 16px', 
                  backgroundColor: '#007bff', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                {submitting ? 'Updating...' : 'Update Survey'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Analytics Dashboard Component
  const AnalyticsDashboard = () => {
    if (!analytics) return null;
    
    return (
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '16px', 
        marginBottom: '24px' 
      }}>
        <div style={{ 
          backgroundColor: '#f8f9fa', 
          padding: '16px', 
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '24px', color: '#495057' }}>
            {analytics.overview.total_surveys || 0}
          </h3>
          <p style={{ margin: 0, color: '#6c757d' }}>Total Surveys</p>
        </div>
        
        <div style={{ 
          backgroundColor: '#d4edda', 
          padding: '16px', 
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '24px', color: '#155724' }}>
            {analytics.overview.active_surveys || 0}
          </h3>
          <p style={{ margin: 0, color: '#155724' }}>Active Surveys</p>
        </div>
        
        <div style={{ 
          backgroundColor: '#cce5ff', 
          padding: '16px', 
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '24px', color: '#004085' }}>
            {analytics.overview.completed_surveys || 0}
          </h3>
          <p style={{ margin: 0, color: '#004085' }}>Completed</p>
        </div>
        
        <div style={{ 
          backgroundColor: '#fff3cd', 
          padding: '16px', 
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '24px', color: '#856404' }}>
            {analytics.overview.total_responses || 0}
          </h3>
          <p style={{ margin: 0, color: '#856404' }}>Total Responses</p>
        </div>
        
        <div style={{ 
          backgroundColor: '#e2e3e5', 
          padding: '16px', 
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '24px', color: '#383d41' }}>
            {Math.round(analytics.overview.avg_responses_per_survey || 0)}
          </h3>
          <p style={{ margin: 0, color: '#383d41' }}>Avg Responses</p>
        </div>
      </div>
    );
  };

  // Form Viewer View
  if (currentView === 'formViewer') {
    return <SurveyFormViewer 
      formUrl={viewerFormUrl}
      onClose={() => {
        setCurrentView(selectedSurvey ? 'details' : 'list');
      }}
    />;
  }

  // Detailed Survey View Component
  if (selectedSurvey) {
    return (
      <div style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <button 
            onClick={() => {
              setSelectedSurvey(null);
              setSurveyDetails(null);
              setCurrentView('list');
            }}
            style={{ 
              padding: '8px 16px', 
              backgroundColor: '#6c757d', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            ← Back to Surveys
          </button>
          
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              onClick={() => setShowEditForm(true)}
              style={{ 
                padding: '8px 16px', 
                backgroundColor: '#ffc107', 
                color: '#212529', 
                border: 'none', 
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Edit Survey
            </button>
            
            {selectedSurvey.survey_status === 'Draft' && (
              <button 
                onClick={() => {
                  const days = prompt('Duration in days (leave empty for indefinite):');
                  handleAction('start', selectedSurvey.id, { duration: days ? parseInt(days) : null });
                }}
                disabled={actionLoading === selectedSurvey.id}
                style={{ 
                  padding: '8px 16px', 
                  backgroundColor: '#28a745', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                {actionLoading === selectedSurvey.id ? 'Starting...' : 'Start Survey'}
              </button>
            )}
            
            {selectedSurvey.survey_status === 'Active' && (
              <button 
                onClick={() => handleAction('stop', selectedSurvey.id)}
                disabled={actionLoading === selectedSurvey.id}
                style={{ 
                  padding: '8px 16px', 
                  backgroundColor: '#dc3545', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                {actionLoading === selectedSurvey.id ? 'Stopping...' : 'Stop Survey'}
              </button>
            )}
            
            <button 
              onClick={() => handleAction('delete', selectedSurvey.id)}
              disabled={actionLoading === selectedSurvey.id}
              style={{ 
                padding: '8px 16px', 
                backgroundColor: '#dc3545', 
                color: 'white', 
                border: 'none', 
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              {actionLoading === selectedSurvey.id ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>

        {detailsLoading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            Loading survey details...
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
            {/* Main content */}
            <div>
              <h2 style={{ marginBottom: '16px' }}>Survey for "{selectedSurvey.idea_name}"</h2>
              
              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <strong>Form URL:</strong> 
                    <button
                      onClick={() => {
                        setViewerFormUrl(selectedSurvey.form_url);
                        setCurrentView('formViewer');
                      }}
                      style={{ 
                        marginLeft: '8px', 
                        padding: '4px 8px',
                        backgroundColor: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      📋 View Form
                    </button>
                    <a href={selectedSurvey.form_url} target="_blank" rel="noopener noreferrer" 
                       style={{ marginLeft: '8px', color: '#007bff', fontSize: '12px' }}>
                      🔗 Raw Data
                    </a>
                  </div>
                  <div>
                    <strong>Creator:</strong> {selectedSurvey.creator_name || selectedSurvey.creator_email}
                  </div>
                  <div>
                    <strong>Created:</strong> {formatDate(selectedSurvey.created_at)}
                  </div>
                  <div>
                    <strong>Last Updated:</strong> {formatDate(selectedSurvey.updated_at)}
                  </div>
                  <div>
                    <strong>Start Time:</strong> {formatDate(selectedSurvey.start_time)}
                  </div>
                  <div>
                    <strong>End Time:</strong> {formatDate(selectedSurvey.end_time)}
                  </div>
                </div>
              </div>

              {/* Response Progress */}
              <div style={{ 
                backgroundColor: '#f8f9fa', 
                padding: '20px', 
                borderRadius: '8px',
                marginBottom: '24px'
              }}>
                <h3 style={{ marginBottom: '16px' }}>Response Collection Progress</h3>
                
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span>Time Progress</span>
                    <span>{selectedSurvey.time_progress_percentage || 0}%</span>
                  </div>
                  <div style={{ 
                    backgroundColor: '#e9ecef', 
                    height: '8px', 
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    <div style={{ 
                      backgroundColor: '#007bff', 
                      height: '100%', 
                      width: `${selectedSurvey.time_progress_percentage || 0}%`,
                      transition: 'width 0.3s ease'
                    }}></div>
                  </div>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: '600', color: '#28a745' }}>
                      {selectedSurvey.total_responses || 0}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6c757d' }}>Total Responses</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: '600', color: '#007bff' }}>
                      {selectedSurvey.unique_responders || 0}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6c757d' }}>Unique Responders</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: '600', color: '#ffc107' }}>
                      {selectedSurvey.response_rate_per_day || 0}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6c757d' }}>Responses/Day</div>
                  </div>
                </div>
              </div>

              {/* Response Timeline */}
              {surveyDetails?.timeline && surveyDetails.timeline.length > 0 && (
                <div style={{ 
                  backgroundColor: '#f8f9fa', 
                  padding: '20px', 
                  borderRadius: '8px',
                  marginBottom: '24px'
                }}>
                  <h3 style={{ marginBottom: '16px' }}>Response Timeline</h3>
                  <div style={{ overflowX: 'auto' }}>
                    <div style={{ display: 'flex', gap: '8px', minWidth: 'max-content', paddingBottom: '8px' }}>
                      {surveyDetails.timeline.map((day, index) => (
                        <div key={index} style={{ 
                          minWidth: '80px',
                          textAlign: 'center',
                          padding: '8px',
                          backgroundColor: 'white',
                          borderRadius: '4px',
                          border: '1px solid #e9ecef'
                        }}>
                          <div style={{ fontSize: '16px', fontWeight: '600', color: '#28a745' }}>
                            {day.responses_count}
                          </div>
                          <div style={{ fontSize: '10px', color: '#6c757d' }}>
                            {new Date(day.response_date).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short'
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Response Details */}
              {surveyDetails?.responses && surveyDetails.responses.length > 0 && (
                <div style={{ 
                  backgroundColor: '#f8f9fa', 
                  padding: '20px', 
                  borderRadius: '8px'
                }}>
                  <h3 style={{ marginBottom: '16px' }}>Recent Responses</h3>
                  <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {surveyDetails.responses.slice(0, 10).map((response, index) => (
                      <div key={response.id} style={{ 
                        backgroundColor: 'white',
                        padding: '12px',
                        marginBottom: '8px',
                        borderRadius: '4px',
                        border: '1px solid #e9ecef',
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr 1fr',
                        gap: '8px',
                        alignItems: 'center'
                      }}>
                        <div>
                          <div style={{ fontWeight: '600', fontSize: '14px' }}>
                            {response.responder_name || response.responder_email}
                          </div>
                          <div style={{ fontSize: '12px', color: '#6c757d' }}>
                            {response.responder_type}
                          </div>
                        </div>
                        <div style={{ fontSize: '12px', color: '#6c757d' }}>
                          {formatDate(response.created_at)}
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <a 
                            href={response.form_response_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            style={{ 
                              fontSize: '12px', 
                              color: '#007bff',
                              textDecoration: 'none'
                            }}
                          >
                            View Response →
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                  {surveyDetails.responses.length > 10 && (
                    <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '12px', color: '#6c757d' }}>
                      Showing first 10 of {surveyDetails.responses.length} responses
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div>
              <div style={{ 
                backgroundColor: '#f8f9fa', 
                padding: '16px', 
                borderRadius: '8px',
                marginBottom: '16px'
              }}>
                <h4 style={{ marginBottom: '12px' }}>Survey Status</h4>
                <span style={getStatusBadge(selectedSurvey.survey_status)}>
                  {selectedSurvey.survey_status}
                </span>
              </div>

              <div style={{ 
                backgroundColor: '#f8f9fa', 
                padding: '16px', 
                borderRadius: '8px',
                marginBottom: '16px'
              }}>
                <h4 style={{ marginBottom: '12px' }}>Idea Information</h4>
                <div style={{ fontSize: '14px', lineHeight: '1.5' }}>
                  <div style={{ marginBottom: '8px' }}>
                    <strong>Audience:</strong> {selectedSurvey.targeted_audience}
                  </div>
                  <div style={{ marginBottom: '8px' }}>
                    <strong>Stage:</strong> {selectedSurvey.idea_stage}
                  </div>
                  <div>
                    <strong>Description:</strong> {selectedSurvey.idea_description?.substring(0, 100)}...
                  </div>
                </div>
              </div>

              {/* Response Analytics */}
              {surveyDetails?.analytics && (
                <div style={{ 
                  backgroundColor: '#f8f9fa', 
                  padding: '16px', 
                  borderRadius: '8px'
                }}>
                  <h4 style={{ marginBottom: '12px' }}>Analytics</h4>
                  <div style={{ fontSize: '14px', lineHeight: '1.5' }}>
                    <div style={{ marginBottom: '8px' }}>
                      <strong>Avg Response Time:</strong> {Math.round(surveyDetails.analytics.averageResponseTime || 0)} hours
                    </div>
                    <div style={{ marginBottom: '8px' }}>
                      <strong>Response Rate:</strong> {surveyDetails.analytics.responseRate} per day
                    </div>
                    {surveyDetails.analytics.totalDuration && (
                      <div style={{ marginBottom: '8px' }}>
                        <strong>Duration:</strong> {Math.round(surveyDetails.analytics.totalDuration)} days
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {showEditForm && <EditSurveyForm />}
      </div>
    );
  }

  // Main Surveys List View
  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ marginBottom: '16px' }}>Survey Management</h2>
        <AnalyticsDashboard />
      </div>

      {/* Filters and Controls */}
      <div style={{ 
        marginBottom: '20px', 
        display: 'flex', 
        gap: '12px',
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        <input
          type="text"
          placeholder="Search by idea name or creator..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ 
            padding: '10px', 
            flex: '1',
            minWidth: '300px',
            border: '1px solid #ced4da', 
            borderRadius: '6px',
            fontSize: '14px'
          }}
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ 
            padding: '10px', 
            border: '1px solid #ced4da', 
            borderRadius: '6px',
            fontSize: '14px'
          }}
        >
          <option value="all">All Statuses</option>
          <option value="Draft">Draft</option>
          <option value="Active">Active</option>
          <option value="Completed">Completed</option>
          <option value="Scheduled">Scheduled</option>
        </select>
        <button 
          onClick={() => setShowCreateForm(true)}
          style={{ 
            padding: '10px 16px', 
            backgroundColor: '#28a745', 
            color: 'white', 
            border: 'none', 
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          + Create Survey
        </button>
        <button 
          onClick={fetchData}
          disabled={loading}
          style={{ 
            padding: '10px 16px', 
            backgroundColor: '#007bff', 
            color: 'white', 
            border: 'none', 
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div style={{ 
          color: '#721c24', 
          backgroundColor: '#f8d7da', 
          padding: '12px', 
          borderRadius: '6px',
          marginBottom: '20px'
        }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>Loading surveys...</div>
      ) : (
        <div>
          <div style={{ 
            marginBottom: '16px', 
            color: '#6c757d',
            fontSize: '14px'
          }}>
            Showing {filteredSurveys.length} of {surveys.length} surveys
          </div>
          
          {filteredSurveys.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '40px',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px'
            }}>
              {surveys.length === 0 ? (
                <div>
                  <h3 style={{ margin: '0 0 16px 0', color: '#6c757d' }}>No surveys created yet</h3>
                  <p style={{ margin: '0 0 16px 0', color: '#6c757d' }}>
                    Get started by creating your first survey for an idea validation study.
                  </p>
                  <button 
                    onClick={() => setShowCreateForm(true)}
                    style={{ 
                      padding: '12px 24px', 
                      backgroundColor: '#28a745', 
                      color: 'white', 
                      border: 'none', 
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '16px'
                    }}
                  >
                    Create First Survey
                  </button>
                </div>
              ) : (
                'No surveys match your search criteria.'
              )}
            </div>
          ) : (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', 
              gap: '20px' 
            }}>
              {filteredSurveys.map(survey => (
                <div
                  key={survey.id}
                  style={{
                    border: '1px solid #e3e6f0',
                    borderRadius: '8px',
                    backgroundColor: 'white',
                    padding: '20px',
                    cursor: 'pointer',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                  }}
                  onClick={() => {
                    setSelectedSurvey(survey);
                    setCurrentView('details');
                  }}
                >
                  <div style={{ marginBottom: '12px' }}>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', lineHeight: '1.3' }}>
                      Survey for "{survey.idea_name}"
                    </h3>
                    <p style={{ 
                      fontSize: '14px', 
                      color: '#6c757d', 
                      margin: '0',
                      lineHeight: '1.4'
                    }}>
                      Target: {survey.targeted_audience}
                    </p>
                  </div>
                  
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '4px' }}>
                      Creator: {survey.creator_name || survey.creator_email}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6c757d' }}>
                      Created: {formatDate(survey.created_at)}
                    </div>
                  </div>

                  <div style={{ marginBottom: '12px' }}>
                    <span style={getStatusBadge(survey.survey_status)}>{survey.survey_status}</span>
                  </div>

                  {/* Progress Bar */}
                  {survey.survey_status === 'Active' && survey.time_progress_percentage > 0 && (
                    <div style={{ marginBottom: '12px' }}>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        fontSize: '12px',
                        color: '#6c757d',
                        marginBottom: '4px'
                      }}>
                        <span>Progress</span>
                        <span>{survey.time_progress_percentage}%</span>
                      </div>
                      <div style={{ 
                        backgroundColor: '#e9ecef', 
                        height: '4px', 
                        borderRadius: '2px',
                        overflow: 'hidden'
                      }}>
                        <div style={{ 
                          backgroundColor: '#007bff',
                          height: '100%', 
                          width: `${survey.time_progress_percentage}%`,
                          transition: 'width 0.3s ease'
                        }}></div>
                      </div>
                    </div>
                  )}

                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '1fr 1fr 1fr', 
                    gap: '8px',
                    marginBottom: '12px',
                    fontSize: '12px',
                    textAlign: 'center'
                  }}>
                    <div>
                      <div style={{ fontWeight: '600', color: '#28a745' }}>
                        {survey.total_responses || 0}
                      </div>
                      <div style={{ color: '#6c757d' }}>Responses</div>
                    </div>
                    <div>
                      <div style={{ fontWeight: '600', color: '#007bff' }}>
                        {survey.unique_responders || 0}
                      </div>
                      <div style={{ color: '#6c757d' }}>Unique</div>
                    </div>
                    <div>
                      <div style={{ fontWeight: '600', color: '#ffc107' }}>
                        {survey.response_rate_per_day || 0}
                      </div>
                      <div style={{ color: '#6c757d' }}>Per Day</div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div style={{ 
                    display: 'flex', 
                    gap: '8px',
                    paddingTop: '12px',
                    borderTop: '1px solid #e9ecef'
                  }}>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setViewerFormUrl(survey.form_url);
                        setCurrentView('formViewer');
                      }}
                      style={{ 
                        flex: 1,
                        padding: '6px 12px', 
                        backgroundColor: '#007bff', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '4px',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      📋 View Form
                    </button>
                    
                    {survey.survey_status === 'Draft' && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAction('start', survey.id);
                        }}
                        disabled={actionLoading === survey.id}
                        style={{ 
                          flex: 1,
                          padding: '6px 12px', 
                          backgroundColor: '#28a745', 
                          color: 'white', 
                          border: 'none', 
                          borderRadius: '4px',
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                      >
                        {actionLoading === survey.id ? 'Starting...' : 'Start'}
                      </button>
                    )}
                    
                    {survey.survey_status === 'Active' && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAction('stop', survey.id);
                        }}
                        disabled={actionLoading === survey.id}
                        style={{ 
                          flex: 1,
                          padding: '6px 12px', 
                          backgroundColor: '#dc3545', 
                          color: 'white', 
                          border: 'none', 
                          borderRadius: '4px',
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                      >
                        {actionLoading === survey.id ? 'Stopping...' : 'Stop'}
                      </button>
                    )}
                  </div>

                  <div style={{ 
                    fontSize: '11px', 
                    color: '#6c757d',
                    marginTop: '8px',
                    textAlign: 'center'
                  }}>
                    {survey.start_time ? `Started: ${formatDate(survey.start_time)}` : 'Not started yet'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showCreateForm && <CreateSurveyForm />}
    </div>
  );
};

export default Surveys;