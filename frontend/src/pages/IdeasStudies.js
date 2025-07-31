import React, { useState, useEffect, useContext, useCallback } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { 
  getAllIdeas, 
  activateIdea, 
  deactivateIdea, 
  resetIdea, 
  updateIdeaStage,
  getStudyAnalytics 
} from '../services/api';

const IdeasStudies = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStage, setSelectedStage] = useState('all');
  const [selectedIdea, setSelectedIdea] = useState(null);
  const [ideas, setIdeas] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const { token } = useContext(AuthContext);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [ideasData, analyticsData] = await Promise.all([
        getAllIdeas(token),
        getStudyAnalytics(token)
      ]);
      setIdeas(ideasData);
      setAnalytics(analyticsData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAction = async (action, ideaId, newStage = null) => {
    setActionLoading(ideaId);
    try {
      let result;
      switch (action) {
        case 'activate':
          result = await activateIdea(token, ideaId);
          break;
        case 'deactivate':
          result = await deactivateIdea(token, ideaId);
          break;
        case 'reset':
          if (window.confirm('Are you sure you want to reset this idea? This will delete all study data.')) {
            result = await resetIdea(token, ideaId);
          } else {
            return;
          }
          break;
        case 'updateStage':
          result = await updateIdeaStage(token, ideaId, newStage);
          break;
        default:
          return; // Exit if unknown action
      }
      
      // Refresh data after action
      await fetchData();
      alert(result.message);
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredIdeas = ideas.filter(idea => {
    const matchesSearch = idea.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          idea.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          idea.targeted_audience.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStage = selectedStage === 'all' || idea.stage === selectedStage;
    return matchesSearch && matchesStage;
  });

  const getStatusBadge = (status) => {
    const baseStyle = {
      padding: '4px 12px',
      borderRadius: '12px',
      fontSize: '12px',
      fontWeight: '600',
      textTransform: 'uppercase'
    };

    switch (status) {
      case 'Completed':
        return { ...baseStyle, backgroundColor: '#d4edda', color: '#155724' };
      case 'In Progress':
        return { ...baseStyle, backgroundColor: '#fff3cd', color: '#856404' };
      case 'Starting':
        return { ...baseStyle, backgroundColor: '#d1ecf1', color: '#0c5460' };
      case 'Inactive':
        return { ...baseStyle, backgroundColor: '#f8d7da', color: '#721c24' };
      default:
        return { ...baseStyle, backgroundColor: '#e2e3e5', color: '#383d41' };
    }
  };

  const getLensStatusIcon = (status) => {
    switch (status) {
      case 'Completed': return '✅';
      case 'In Progress': return '🔄';
      case 'Pending': return '⏳';
      default: return '❓';
    }
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
  };

  const getLensProgress = (idea) => {
    const lenses = [
      { name: 'SME', status: idea.sme_lens_status },
      { name: 'Survey', status: idea.survey_lens_status },
      { name: 'Social', status: idea.social_lens_status },
      { name: 'Peer', status: idea.peer_lens_status }
    ];
    
    const completed = lenses.filter(lens => lens.status === 'Completed').length;
    return { completed, total: 4, percentage: (completed / 4) * 100 };
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
            {analytics.total_ideas || 0}
          </h3>
          <p style={{ margin: 0, color: '#6c757d' }}>Total Ideas</p>
        </div>
        
        <div style={{ 
          backgroundColor: '#d1ecf1', 
          padding: '16px', 
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '24px', color: '#0c5460' }}>
            {analytics.starting_ideas || 0}
          </h3>
          <p style={{ margin: 0, color: '#0c5460' }}>Starting</p>
        </div>
        
        <div style={{ 
          backgroundColor: '#fff3cd', 
          padding: '16px', 
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '24px', color: '#856404' }}>
            {analytics.in_progress_ideas || 0}
          </h3>
          <p style={{ margin: 0, color: '#856404' }}>In Progress</p>
        </div>
        
        <div style={{ 
          backgroundColor: '#d4edda', 
          padding: '16px', 
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '24px', color: '#155724' }}>
            {analytics.completed_ideas || 0}
          </h3>
          <p style={{ margin: 0, color: '#155724' }}>Completed</p>
        </div>
        
        <div style={{ 
          backgroundColor: '#e2e3e5', 
          padding: '16px', 
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '24px', color: '#383d41' }}>
            {analytics.active_studies || 0}
          </h3>
          <p style={{ margin: 0, color: '#383d41' }}>Active Studies</p>
        </div>
      </div>
    );
  };

  // Detailed view for selected idea
  if (selectedIdea) {
    const progress = getLensProgress(selectedIdea);
    
    return (
      <div style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <button 
            onClick={() => setSelectedIdea(null)}
            style={{ 
              padding: '8px 16px', 
              backgroundColor: '#6c757d', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            ← Back to Ideas
          </button>
          
          <div style={{ display: 'flex', gap: '8px' }}>
            {selectedIdea.stage !== 'Starting' && (
              <button 
                onClick={() => handleAction('activate', selectedIdea.id)}
                disabled={actionLoading === selectedIdea.id}
                style={{ 
                  padding: '8px 16px', 
                  backgroundColor: '#28a745', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Activate
              </button>
            )}
            
            {selectedIdea.stage !== 'Inactive' && (
              <button 
                onClick={() => handleAction('deactivate', selectedIdea.id)}
                disabled={actionLoading === selectedIdea.id}
                style={{ 
                  padding: '8px 16px', 
                  backgroundColor: '#dc3545', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Deactivate
              </button>
            )}
            
            <button 
              onClick={() => handleAction('reset', selectedIdea.id)}
              disabled={actionLoading === selectedIdea.id}
              style={{ 
                padding: '8px 16px', 
                backgroundColor: '#ffc107', 
                color: '#212529', 
                border: 'none', 
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Reset
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
          {/* Main content */}
          <div>
            <h2 style={{ marginBottom: '16px' }}>{selectedIdea.name}</h2>
            <p style={{ color: '#6c757d', marginBottom: '16px' }}>{selectedIdea.description}</p>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              <div>
                <strong>Target Audience:</strong> {selectedIdea.targeted_audience}
              </div>
              <div>
                <strong>Creator:</strong> {selectedIdea.creator_name || selectedIdea.creator_email}
              </div>
              <div>
                <strong>Created:</strong> {formatDate(selectedIdea.created_at)}
              </div>
              <div>
                <strong>Updated:</strong> {formatDate(selectedIdea.updated_at)}
              </div>
            </div>

            {/* Study Progress */}
            <div style={{ 
              backgroundColor: '#f8f9fa', 
              padding: '20px', 
              borderRadius: '8px',
              marginBottom: '24px'
            }}>
              <h3 style={{ marginBottom: '16px' }}>Study Progress</h3>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span>Overall Progress</span>
                  <span>{progress.completed}/{progress.total} Lenses Completed</span>
                </div>
                <div style={{ 
                  backgroundColor: '#e9ecef', 
                  height: '8px', 
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}>
                  <div style={{ 
                    backgroundColor: '#28a745', 
                    height: '100%', 
                    width: `${progress.percentage}%`,
                    transition: 'width 0.3s ease'
                  }}></div>
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                {[
                  { name: 'SME', status: selectedIdea.sme_lens_status },
                  { name: 'Survey', status: selectedIdea.survey_lens_status },
                  { name: 'Social', status: selectedIdea.social_lens_status },
                  { name: 'Peer', status: selectedIdea.peer_lens_status }
                ].map(lens => (
                  <div key={lens.name} style={{ 
                    textAlign: 'center', 
                    padding: '12px',
                    backgroundColor: 'white',
                    borderRadius: '6px'
                  }}>
                    <div style={{ fontSize: '24px', marginBottom: '4px' }}>
                      {getLensStatusIcon(lens.status)}
                    </div>
                    <div style={{ fontWeight: '600', marginBottom: '2px' }}>{lens.name}</div>
                    <div style={{ fontSize: '12px', color: '#6c757d' }}>{lens.status}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div>
            <div style={{ 
              backgroundColor: '#f8f9fa', 
              padding: '16px', 
              borderRadius: '8px',
              marginBottom: '16px'
            }}>
              <h4 style={{ marginBottom: '12px' }}>Status</h4>
              <div style={{ marginBottom: '12px' }}>
                <span style={getStatusBadge(selectedIdea.stage)}>{selectedIdea.stage}</span>
              </div>
              
              <div>
                <strong>Study Status:</strong> {selectedIdea.study_status}
              </div>
            </div>

            <div style={{ 
              backgroundColor: '#f8f9fa', 
              padding: '16px', 
              borderRadius: '8px',
              marginBottom: '16px'
            }}>
              <h4 style={{ marginBottom: '12px' }}>Study Information</h4>
              <div style={{ fontSize: '14px', lineHeight: '1.5' }}>
                <div style={{ marginBottom: '8px' }}>
                  <strong>Total Responses:</strong> {selectedIdea.total_responses || 0}
                </div>
                {selectedIdea.form_url && (
                  <div style={{ marginBottom: '8px' }}>
                    <strong>Form URL:</strong> 
                    <a href={selectedIdea.form_url} target="_blank" rel="noopener noreferrer" 
                       style={{ marginLeft: '8px', color: '#007bff' }}>
                      View Form
                    </a>
                  </div>
                )}
                {selectedIdea.start_time && (
                  <div style={{ marginBottom: '8px' }}>
                    <strong>Study Started:</strong> {formatDate(selectedIdea.start_time)}
                  </div>
                )}
                {selectedIdea.end_time && (
                  <div style={{ marginBottom: '8px' }}>
                    <strong>Study Ended:</strong> {formatDate(selectedIdea.end_time)}
                  </div>
                )}
              </div>
            </div>

            <div style={{ 
              backgroundColor: '#f8f9fa', 
              padding: '16px', 
              borderRadius: '8px'
            }}>
              <h4 style={{ marginBottom: '12px' }}>Quick Actions</h4>
              <select 
                onChange={(e) => {
                  if (e.target.value) {
                    handleAction('updateStage', selectedIdea.id, e.target.value);
                    e.target.value = '';
                  }
                }}
                style={{ 
                  width: '100%', 
                  padding: '8px', 
                  border: '1px solid #ced4da', 
                  borderRadius: '4px',
                  marginBottom: '12px'
                }}
              >
                <option value="">Change Stage...</option>
                <option value="Starting">Starting</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main Ideas List View
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="heading-main mb-8">Ideas & Studies</h1>
      {/* Filters and Search */}
      <div className="card-dark card-accent p-6 mb-8 flex items-center gap-6">
        <input
          type="text"
          placeholder="Search ideas..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="bg-black text-purple-main border border-purple-main rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-main"
        />
        <select
          value={selectedStage}
          onChange={e => setSelectedStage(e.target.value)}
          className="bg-black text-purple-main border border-purple-main rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-main"
        >
          <option value="all">All Stages</option>
          <option value="Starting">Starting</option>
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
          <option value="Inactive">Inactive</option>
        </select>
      </div>
      {/* Ideas Table/Card List */}
      <div className="card-dark card-accent p-6">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>Loading ideas...</div>
        ) : (
          <div>
            <div style={{ 
              marginBottom: '16px', 
              color: '#6c757d',
              fontSize: '14px'
            }}>
              Showing {filteredIdeas.length} of {ideas.length} ideas
            </div>
            
            {filteredIdeas.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '40px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px'
              }}>
                No ideas found matching your criteria.
              </div>
            ) : (
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', 
                gap: '20px' 
              }}>
                {filteredIdeas.map(idea => {
                  const progress = getLensProgress(idea);
                  
                  return (
                    <div
                      key={idea.id}
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
                      onClick={() => setSelectedIdea(idea)}
                    >
                      <div style={{ marginBottom: '12px' }}>
                        <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', lineHeight: '1.3' }}>
                          {idea.name}
                        </h3>
                        <p style={{ 
                          fontSize: '14px', 
                          color: '#6c757d', 
                          margin: '0',
                          lineHeight: '1.4',
                          overflow: 'hidden',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical'
                        }}>
                          {idea.description}
                        </p>
                      </div>
                      
                      <div style={{ marginBottom: '12px' }}>
                        <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '4px' }}>
                          Creator: {idea.creator_name || idea.creator_email}
                        </div>
                        <div style={{ fontSize: '12px', color: '#6c757d' }}>
                          Target: {idea.targeted_audience}
                        </div>
                      </div>

                      <div style={{ marginBottom: '12px' }}>
                        <span style={getStatusBadge(idea.stage)}>{idea.stage}</span>
                      </div>

                      {/* Study Progress Bar */}
                      <div style={{ marginBottom: '12px' }}>
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          fontSize: '12px',
                          color: '#6c757d',
                          marginBottom: '4px'
                        }}>
                          <span>Study Progress</span>
                          <span>{progress.completed}/4 Lenses</span>
                        </div>
                        <div style={{ 
                          backgroundColor: '#e9ecef', 
                          height: '6px', 
                          borderRadius: '3px',
                          overflow: 'hidden'
                        }}>
                          <div style={{ 
                            backgroundColor: progress.percentage === 100 ? '#28a745' : 
                                           progress.percentage >= 50 ? '#ffc107' : '#17a2b8',
                            height: '100%', 
                            width: `${progress.percentage}%`,
                            transition: 'width 0.3s ease'
                          }}></div>
                        </div>
                      </div>

                      {/* Lens Status Icons */}
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        marginBottom: '12px'
                      }}>
                        {[
                          { name: 'SME', status: idea.sme_lens_status },
                          { name: 'Survey', status: idea.survey_lens_status },
                          { name: 'Social', status: idea.social_lens_status },
                          { name: 'Peer', status: idea.peer_lens_status }
                        ].map(lens => (
                          <div key={lens.name} style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '16px' }}>
                              {getLensStatusIcon(lens.status)}
                            </div>
                            <div style={{ fontSize: '10px', color: '#6c757d' }}>
                              {lens.name}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Quick Actions */}
                      <div style={{ 
                        display: 'flex', 
                        gap: '8px',
                        paddingTop: '12px',
                        borderTop: '1px solid #e9ecef'
                      }}>
                        {idea.stage === 'Inactive' ? (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAction('activate', idea.id);
                            }}
                            disabled={actionLoading === idea.id}
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
                            {actionLoading === idea.id ? 'Loading...' : 'Activate'}
                          </button>
                        ) : (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAction('deactivate', idea.id);
                            }}
                            disabled={actionLoading === idea.id}
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
                            {actionLoading === idea.id ? 'Loading...' : 'Deactivate'}
                          </button>
                        )}
                        
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAction('reset', idea.id);
                          }}
                          disabled={actionLoading === idea.id}
                          style={{ 
                            flex: 1,
                            padding: '6px 12px', 
                            backgroundColor: '#ffc107', 
                            color: '#212529', 
                            border: 'none', 
                            borderRadius: '4px',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          Reset
                        </button>
                      </div>

                      <div style={{ 
                        fontSize: '11px', 
                        color: '#6c757d',
                        marginTop: '8px',
                        textAlign: 'center'
                      }}>
                        {idea.total_responses || 0} responses • {idea.study_status}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default IdeasStudies;