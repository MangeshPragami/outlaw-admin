// Create new file: src/pages/Forms.js
import React, { useState, useEffect, useContext, useCallback } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import SurveyFormViewer from '../components/SurveyFormViewer';
import ResponseViewer from '../components/ResponseViewer';
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

const Forms = () => {
  const [surveys, setSurveys] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [ideas, setIdeas] = useState([]);
  const [selectedSurvey, setSelectedSurvey] = useState(null);
  const [surveyDetails, setSurveyDetails] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [viewerFormUrl, setViewerFormUrl] = useState('');
  const [selectedResponseUrl, setSelectedResponseUrl] = useState('');
  const [currentView, setCurrentView] = useState('list'); // 'list', 'details', 'formViewer', 'responseViewer'
  const [loading, setLoading] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
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
          if (window.confirm('Are you sure you want to delete this form? This will also delete all responses.')) {
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
    return matchesSearch;
  });

  // Create Form Component
  const CreateFormComponent = () => {
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
        backgroundColor: 'rgba(0,0,0,0.8)', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        zIndex: 1000
      }}>
        <div style={{ 
          backgroundColor: '#1e1e2e', 
          padding: '24px', 
          borderRadius: '8px', 
          width: '500px',
          maxHeight: '80vh',
          overflow: 'auto',
          border: '1px solid #8A5CF6'
        }}>
          <h3 style={{ marginTop: 0, color: '#8A5CF6' }}>Create New Form</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', color: '#e0e0e0' }}>
                Select Idea/Study *
              </label>
              <select
                value={formData.idea_id}
                onChange={(e) => setFormData(prev => ({...prev, idea_id: e.target.value}))}
                required
                style={{ 
                  width: '100%', 
                  padding: '8px', 
                  border: '1px solid #8A5CF6', 
                  borderRadius: '4px',
                  backgroundColor: '#121212',
                  color: 'white',
                  fontSize: '14px'
                }}
              >
                <option value="">Choose an idea...</option>
                {ideas.filter(idea => !surveys.some(s => s.idea_id === idea.id)).map(idea => (
                  <option key={idea.id} value={idea.id}>
                    {idea.name} - {idea.targeted_audience}
                  </option>
                ))}
              </select>
              <small style={{ color: '#6c757d' }}>Only ideas without existing forms are shown</small>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', color: '#e0e0e0' }}>
                Form URL *
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
                  border: '1px solid #8A5CF6', 
                  borderRadius: '4px',
                  backgroundColor: '#121212',
                  color: 'white',
                  fontSize: '14px'
                }}
              />
              <small style={{ color: '#6c757d' }}>Link to your external form</small>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', color: '#e0e0e0' }}>
                Start Time (Optional)
              </label>
              <input
                type="datetime-local"
                value={formData.start_time}
                onChange={(e) => setFormData(prev => ({...prev, start_time: e.target.value}))}
                style={{ 
                  width: '100%', 
                  padding: '8px', 
                  border: '1px solid #8A5CF6', 
                  borderRadius: '4px',
                  backgroundColor: '#121212',
                  color: 'white',
                  fontSize: '14px'
                }}
              />
              <small style={{ color: '#6c757d' }}>Leave empty to start manually later</small>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', color: '#e0e0e0' }}>
                End Time (Optional)
              </label>
              <input
                type="datetime-local"
                value={formData.end_time}
                onChange={(e) => setFormData(prev => ({...prev, end_time: e.target.value}))}
                style={{ 
                  width: '100%', 
                  padding: '8px', 
                  border: '1px solid #8A5CF6', 
                  borderRadius: '4px',
                  backgroundColor: '#121212',
                  color: 'white',
                  fontSize: '14px'
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
                  backgroundColor: '#8A5CF6', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                {submitting ? 'Creating...' : 'Create Form'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Edit Form Component
  const EditFormComponent = () => {
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
        backgroundColor: 'rgba(0,0,0,0.8)', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        zIndex: 1000
      }}>
        <div style={{ 
          backgroundColor: '#1e1e2e', 
          padding: '24px', 
          borderRadius: '8px', 
          width: '500px',
          maxHeight: '80vh',
          overflow: 'auto',
          border: '1px solid #8A5CF6'
        }}>
          <h3 style={{ marginTop: 0, color: '#8A5CF6' }}>Edit Form</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', color: '#e0e0e0' }}>
                Form URL *
              </label>
              <input
                type="url"
                value={formData.form_url}
                onChange={(e) => setFormData(prev => ({...prev, form_url: e.target.value}))}
                required
                style={{ 
                  width: '100%', 
                  padding: '8px', 
                  border: '1px solid #8A5CF6', 
                  borderRadius: '4px',
                  backgroundColor: '#121212',
                  color: 'white',
                  fontSize: '14px'
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', color: '#e0e0e0' }}>
                Start Time
              </label>
              <input
                type="datetime-local"
                value={formData.start_time}
                onChange={(e) => setFormData(prev => ({...prev, start_time: e.target.value}))}
                style={{ 
                  width: '100%', 
                  padding: '8px', 
                  border: '1px solid #8A5CF6', 
                  borderRadius: '4px',
                  backgroundColor: '#121212',
                  color: 'white',
                  fontSize: '14px'
                }}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', color: '#e0e0e0' }}>
                End Time
              </label>
              <input
                type="datetime-local"
                value={formData.end_time}
                onChange={(e) => setFormData(prev => ({...prev, end_time: e.target.value}))}
                style={{ 
                  width: '100%', 
                  padding: '8px', 
                  border: '1px solid #8A5CF6', 
                  borderRadius: '4px',
                  backgroundColor: '#121212',
                  color: 'white',
                  fontSize: '14px'
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
                  backgroundColor: '#8A5CF6', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                {submitting ? 'Updating...' : 'Update Form'}
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
          <p style={{ margin: 0, color: '#6c757d' }}>Total Forms</p>
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

  // Response Viewer View
  if (currentView === 'responseViewer') {
    return <ResponseViewer 
      responseUrl={selectedResponseUrl}
      onClose={() => {
        setCurrentView(selectedSurvey ? 'details' : 'list');
      }}
    />;
  }

  // Detailed Form View Component
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
            ← Back to Forms
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
              Edit Form
            </button>
            
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
            Loading form details...
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
            {/* Main content */}
            <div>
              <h2 style={{ marginBottom: '16px', color: '#8A5CF6' }}>Form for "{selectedSurvey.idea_name}"</h2>
              
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
                        backgroundColor: '#8A5CF6',
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
                       style={{ marginLeft: '8px', color: '#8A5CF6', fontSize: '12px' }}>
                      🔗 Raw Data
                    </a>
                  </div>
                  <div>
                    <strong>Creator:</strong> {selectedSurvey.creator_id}
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
                backgroundColor: '#1e1e2e', 
                padding: '20px', 
                borderRadius: '8px',
                marginBottom: '24px',
                border: '1px solid #8A5CF6'
              }}>
                <h3 style={{ marginBottom: '16px', color: '#8A5CF6' }}>Response Collection Progress</h3>
                
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
                  backgroundColor: '#1e1e2e', 
                  padding: '20px', 
                  borderRadius: '8px',
                  marginBottom: '24px',
                  border: '1px solid #8A5CF6'
                }}>
                  <h3 style={{ marginBottom: '16px', color: '#8A5CF6' }}>Response Timeline</h3>
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
                  backgroundColor: '#1e1e2e', 
                  padding: '20px', 
                  borderRadius: '8px',
                  border: '1px solid #8A5CF6'
                }}>
                  <h3 style={{ marginBottom: '16px', color: '#8A5CF6' }}>Recent Responses</h3>
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
                          <div style={{ fontWeight: '600', fontSize: '14px', color: '#000' }}>
                            Respondent ID: {response.responder_id}
                          </div>
                          <div style={{ fontSize: '12px', color: '#6c757d' }}>
                            {response.responder_type || 'Respondent'}
                          </div>
                        </div>
                        <div style={{ fontSize: '12px', color: '#6c757d' }}>
                          {formatDate(response.created_at)}
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <button 
                            onClick={() => {
                              setSelectedResponseUrl(response.form_response_url);
                              setCurrentView('responseViewer');
                            }}
                            style={{ 
                              fontSize: '12px', 
                              color: '#8A5CF6',
                              backgroundColor: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              textDecoration: 'underline'
                            }}
                          >
                            View Response →
                          </button>
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
                backgroundColor: '#1e1e2e', 
                padding: '16px', 
                borderRadius: '8px',
                marginBottom: '16px',
                border: '1px solid #8A5CF6'
              }}>
                <h4 style={{ marginBottom: '12px', color: '#8A5CF6' }}>Idea Information</h4>
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
            </div>
          </div>
        )}

        {showEditForm && <EditFormComponent />}
      </div>
    );
  }

  // Main Forms List View
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="heading-main mb-8">Forms</h1>
      
      {/* Analytics Dashboard */}
      <AnalyticsDashboard />
      
      {/* Filters and Search */}
      <div className="card-dark card-accent p-6 mb-8 flex items-center gap-6">
        <input
          type="text"
          placeholder="Search forms..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="bg-black text-purple-main border border-purple-main rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-main"
        />
        <button onClick={() => setShowCreateForm(true)} className="btn-primary ml-auto">Create Form</button>
      </div>
      
      {/* Form Table/Card List */}
      <div className="card-dark card-accent p-6">
        {filteredSurveys.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#8A5CF6', padding: '24px' }}>No forms found.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ color: '#8A5CF6', borderBottom: '2px solid #8A5CF6' }}>
                <th>Form ID</th>
                <th>Idea Name (ID)</th>
                <th>Creator</th>
                <th>Responses</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSurveys.map(survey => (
                <tr key={survey.id} style={{ borderBottom: '1px solid #232323' }}>
                  <td>{survey.id}</td>
                  <td>{survey.idea_name} ({survey.idea_id})</td>
                  <td>{survey.creator_email}</td>
                  <td>{survey.total_responses || 0}</td>
                  <td>
                    <button onClick={() => setSelectedSurvey(survey)} className="btn-primary" style={{ marginRight: '8px', padding: '4px 12px', fontSize: '12px' }}>View</button>
                    <button onClick={() => handleAction('delete', survey.id)} className="btn-primary" style={{ backgroundColor: '#dc3545', padding: '4px 12px', fontSize: '12px' }}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create Form Modal */}
      {showCreateForm && <CreateFormComponent />}
    </div>
  );
};

export default Forms;