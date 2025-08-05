import axios from 'axios';
import React, { useState, useEffect, useContext, useCallback } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { 
  getAllIdeas, 
  deleteIdea,
  updateIdeaStage,
  updateIdeaStatus,
  getStudyAnalytics 
} from '../services/api';

const IdeasStudies = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStage, setSelectedStage] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedIdea, setSelectedIdea] = useState(null);
  const [ideas, setIdeas] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  
  // ADD THIS MISSING STATE VARIABLE
  const [aiContentViewer, setAiContentViewer] = useState({ show: false, type: '', url: '' });
  
  const { token } = useContext(AuthContext);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const ideasData = await getAllIdeas(token);
      setIdeas(ideasData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAction = async (action, ideaId, value = null) => {
    setActionLoading(ideaId);
    try {
      let result;
      switch (action) {
        case 'delete':
          if (window.confirm('Are you sure you want to delete this idea? This action cannot be undone.')) {
            result = await deleteIdea(token, ideaId);
          } else {
            return;
          }
          break;
        case 'updateStage':
          result = await updateIdeaStage(token, ideaId, value);
          break;
        case 'updateStatus':
          result = await updateIdeaStatus(token, ideaId, value);
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

  const filteredIdeas = ideas.filter(idea => {
    const matchesSearch = idea.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          idea.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          idea.targeted_audience.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStage = selectedStage === 'all' || idea.stage === selectedStage;
    const matchesStatus = selectedStatus === 'all' || idea.status === selectedStatus;
    return matchesSearch && matchesStage && matchesStatus;
  });

  const getStatusBadge = (status) => {
    const baseStyle = {
      padding: '4px 12px',
      borderRadius: '12px',
      fontSize: '12px',
      fontWeight: '600',
      textTransform: 'uppercase'
    };

    switch (status?.toLowerCase()) {
      case 'active':
        return { ...baseStyle, backgroundColor: '#d4edda', color: '#155724' };
      case 'in progress':
        return { ...baseStyle, backgroundColor: '#fff3cd', color: '#856404' };
      case 'inactive':
        return { ...baseStyle, backgroundColor: '#f8d7da', color: '#721c24' };
      default:
        return { ...baseStyle, backgroundColor: '#e2e3e5', color: '#383d41' };
    }
  };

  const getStageBadge = (stage) => {
    const baseStyle = {
      padding: '4px 12px',
      borderRadius: '12px',
      fontSize: '12px',
      fontWeight: '600',
      textTransform: 'uppercase'
    };

    switch (stage?.toLowerCase()) {
      case 'ideation & planning':
        return { ...baseStyle, backgroundColor: '#d1ecf1', color: '#0c5460' };
      case 'testing':
        return { ...baseStyle, backgroundColor: '#fff3cd', color: '#856404' };
      case 'beta':
        return { ...baseStyle, backgroundColor: '#cce5ff', color: '#004085' };
      case 'prototype':
        return { ...baseStyle, backgroundColor: '#d4edda', color: '#155724' };
      default:
        return { ...baseStyle, backgroundColor: '#e2e3e5', color: '#383d41' };
    }
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('en-IN', {
      day: 'numeric', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderAttachments = (idea) => {
    const attachments = [];
    if (idea.pitch_deck) attachments.push({ type: 'Pitch Deck', url: idea.pitch_deck, icon: '📄' });
    if (idea.voice_note) attachments.push({ type: 'Voice Note', url: idea.voice_note, icon: '🎵' });
    if (idea.document) attachments.push({ type: 'Document', url: idea.document, icon: '📋' });
    
    if (attachments.length === 0) {
      return <span style={{ color: '#6c757d', fontSize: '12px' }}>No attachments</span>;
    }
    
    return attachments.map((attachment, index) => (
      <a 
        key={index}
        href={attachment.url} 
        target="_blank" 
        rel="noopener noreferrer"
        style={{ 
          marginRight: '8px', 
          color: '#007bff', 
          textDecoration: 'none',
          fontSize: '12px'
        }}
      >
        {attachment.icon} {attachment.type}
      </a>
    ));
  };

  // FIXED renderAILinks function with correct type mapping
  const renderAILinks = (idea, isDetailView = false) => {
    const aiLinks = [
      { field: 'idea_capture', label: 'Idea Analysis', icon: '🧠', type: 'idea_analysis' },
      { field: 'lens_selector', label: 'Lens Recommendations', icon: '🔍', type: 'lens_recommendations' },
      { field: 'survey_generator', label: 'Generated Survey', icon: '📊', type: 'generated_survey' }
    ];

    return aiLinks.map((link, index) => {
      const url = idea[link.field];
      if (url) {
        return (
          <div key={index} style={{ marginBottom: isDetailView ? '8px' : '4px' }}>
            <button
              onClick={(e) => {
                e.stopPropagation(); // Prevent card click when in list view
                setAiContentViewer({ show: true, type: link.type, url: url });
              }}
              style={{ 
                background: 'none',
                border: 'none',
                color: '#8A5CF6', 
                textDecoration: 'underline',
                fontSize: isDetailView ? '14px' : '12px',
                cursor: 'pointer',
                padding: 0,
                textAlign: 'left'
              }}
            >
              {link.icon} {link.label}
            </button>
          </div>
        );
      } else {
        return (
          <div key={index} style={{ 
            marginBottom: isDetailView ? '8px' : '4px',
            color: '#6c757d',
            fontSize: isDetailView ? '14px' : '12px'
          }}>
            {link.icon} {link.label}: CREATOR DID NOT USE THIS LENS
          </div>
        );
      }
    });
  };

  // AI Content Viewer Component
  const AIContentViewer = ({ contentType, url, onClose }) => {
    const [content, setContent] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
// Replace the fetchContent function in your existing AIContentViewer component
// Replace your fetchContent function with this debug version
const fetchContent = async () => {
  if (!url) {
    console.error('❌ No URL provided');
    setError('No content URL provided');
    return;
  }

  console.log('🔍 Starting fetch process...');
  console.log('📋 Content Type:', contentType);
  console.log('🔗 URL:', url);
  console.log('🌐 URL Type:', typeof url);
  console.log('✅ URL Valid:', url.startsWith('http'));

  setLoading(true);
  setError('');
  
  try {
    // Method 1: Direct fetch
    console.log('🚀 Trying Method 1: Direct fetch...');
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache',
        },
        mode: 'cors',
      });
      
      console.log('📊 Response status:', response.status);
      console.log('📊 Response ok:', response.ok);
      console.log('📊 Response headers:', [...response.headers.entries()]);
      
      if (response.ok) {
        const text = await response.text();
        console.log('📝 Raw response text (first 200 chars):', text.substring(0, 200));
        
        try {
          const data = JSON.parse(text);
          console.log('✅ Method 1 SUCCESS - Parsed JSON:', data);
          setContent(data);
          return;
        } catch (parseError) {
          console.error('❌ JSON parse error:', parseError);
          throw new Error(`Invalid JSON: ${parseError.message}`);
        }
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (directError) {
      console.error('❌ Method 1 failed:', directError.message);
      
      // Method 2: Axios
      console.log('🚀 Trying Method 2: Axios...');
      try {
        const axiosResponse = await axios({
          method: 'GET',
          url: url,
          timeout: 15000,
          headers: {
            'Accept': 'application/json',
          },
          validateStatus: function (status) {
            return status < 500;
          }
        });
        
        console.log('📊 Axios status:', axiosResponse.status);
        console.log('📊 Axios data type:', typeof axiosResponse.data);
        console.log('📊 Axios data:', axiosResponse.data);
        
        console.log('✅ Method 2 SUCCESS - Axios data:', axiosResponse.data);
        setContent(axiosResponse.data);
        return;
      } catch (axiosError) {
        console.error('❌ Method 2 failed:', axiosError.message);
        console.error('❌ Axios error details:', axiosError.response?.data);
        
        // Method 3: Try the URL directly in a new tab (for testing)
        console.log('🔗 Try opening this URL directly:', url);
        console.log('💡 If the URL works in browser, it might be a CORS issue');
        
        throw new Error(`All methods failed. Last error: ${axiosError.message}`);
      }
    }
    
  } catch (err) {
    console.error('❌ FINAL ERROR:', err);
    console.error('❌ Error stack:', err.stack);
    setError(`Failed to load ${contentType}: ${err.message}`);
  } finally {
    setLoading(false);
    console.log('🏁 Fetch process completed');
  }
};



    React.useEffect(() => {
      fetchContent();
    }, [url]);

    const renderIdeaAnalysis = (data) => {
  if (!data) return <div style={{ color: '#dc3545' }}>No idea analysis data available</div>;
  
  // The actual data is in data.finalize
  const analysisData = data.finalize || data;
  
  if (!analysisData) {
    return <div style={{ color: '#dc3545' }}>No analysis data found in response</div>;
  }

  return (
    <div style={{ color: '#ffffff' }}>
      <h3 style={{ color: '#8A5CF6', marginBottom: '16px' }}>💡 Idea Analysis</h3>
      
      {analysisData.summary && (
        <div style={{ 
          backgroundColor: '#2a2a2a', 
          padding: '16px', 
          borderRadius: '8px', 
          marginBottom: '16px',
          border: '1px solid #444'
        }}>
          <h4 style={{ color: '#8A5CF6', marginBottom: '8px' }}>Summary</h4>
          <p style={{ color: '#cccccc', lineHeight: '1.5' }}>{analysisData.summary}</p>
        </div>
      )}

      {analysisData.burningProblems && (
        <div style={{ 
          backgroundColor: '#2a2a2a', 
          padding: '16px', 
          borderRadius: '8px', 
          marginBottom: '16px',
          border: '1px solid #444'
        }}>
          <h4 style={{ color: '#8A5CF6', marginBottom: '8px' }}>🔥 Burning Problems</h4>
          <ul style={{ color: '#cccccc', paddingLeft: '20px' }}>
            {analysisData.burningProblems.map((problem, index) => (
              <li key={index} style={{ marginBottom: '8px' }}>{problem}</li>
            ))}
          </ul>
        </div>
      )}

      {analysisData.strengths && (
        <div style={{ 
          backgroundColor: '#2a2a2a', 
          padding: '16px', 
          borderRadius: '8px', 
          marginBottom: '16px',
          border: '1px solid #444'
        }}>
          <h4 style={{ color: '#8A5CF6', marginBottom: '8px' }}>✅ Strengths</h4>
          <ul style={{ color: '#cccccc', paddingLeft: '20px' }}>
            {analysisData.strengths.map((strength, index) => (
              <li key={index} style={{ marginBottom: '4px' }}>{strength}</li>
            ))}
          </ul>
        </div>
      )}

      {analysisData.challenges && (
        <div style={{ 
          backgroundColor: '#2a2a2a', 
          padding: '16px', 
          borderRadius: '8px', 
          marginBottom: '16px',
          border: '1px solid #444'
        }}>
          <h4 style={{ color: '#8A5CF6', marginBottom: '8px' }}>⚠️ Challenges</h4>
          <ul style={{ color: '#cccccc', paddingLeft: '20px' }}>
            {analysisData.challenges.map((challenge, index) => (
              <li key={index} style={{ marginBottom: '4px' }}>{challenge}</li>
            ))}
          </ul>
        </div>
      )}

      {analysisData.recommendations && (
        <div style={{ 
          backgroundColor: '#2a2a2a', 
          padding: '16px', 
          borderRadius: '8px', 
          marginBottom: '16px',
          border: '1px solid #444'
        }}>
          <h4 style={{ color: '#8A5CF6', marginBottom: '8px' }}>💡 Recommendations</h4>
          <ul style={{ color: '#cccccc', paddingLeft: '20px' }}>
            {analysisData.recommendations.map((rec, index) => (
              <li key={index} style={{ marginBottom: '4px' }}>{rec}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Show raw data structure for debugging */}
      <div style={{ 
        backgroundColor: '#2a2a2a', 
        padding: '16px', 
        borderRadius: '8px', 
        border: '1px solid #444',
        marginTop: '20px'
      }}>
        <h4 style={{ color: '#8A5CF6', marginBottom: '8px' }}>🔍 Debug: Raw Data Structure</h4>
        <pre style={{ 
          color: '#cccccc', 
          fontSize: '12px', 
          lineHeight: '1.4',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          maxHeight: '200px',
          overflowY: 'auto'
        }}>
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    </div>
  );
};

   // Replace your renderLensRecommendations function with this updated version

const renderLensRecommendations = (data) => {
  if (!data) return <div style={{ color: '#dc3545' }}>No lens recommendations available</div>;
  
  // From the debug output, I can see the structure is: data.result.results (array of lens objects)
  const lensData = data.result?.results || data.results || [];
  
  if (!lensData || lensData.length === 0) {
    return (
      <div style={{ color: '#ffffff' }}>
        <h3 style={{ color: '#8A5CF6', marginBottom: '16px' }}>🔍 Lens Recommendations</h3>
        <div style={{ color: '#dc3545', marginBottom: '20px' }}>
          No recommendations found in response
        </div>
        
        {/* Show raw data structure for debugging */}
        <div style={{ 
          backgroundColor: '#2a2a2a', 
          padding: '16px', 
          borderRadius: '8px', 
          border: '1px solid #444'
        }}>
          <h4 style={{ color: '#8A5CF6', marginBottom: '8px' }}>🔍 Debug: Raw Data Structure</h4>
          <pre style={{ 
            color: '#cccccc', 
            fontSize: '12px', 
            lineHeight: '1.4',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            maxHeight: '200px',
            overflowY: 'auto'
          }}>
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      </div>
    );
  }

  return (
    <div style={{ color: '#ffffff' }}>
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div style={{ fontSize: '32px' }}>🔍</div>
          <h3 style={{ color: '#8A5CF6', margin: 0, fontSize: '24px' }}>Research Lens Recommendations</h3>
        </div>
        <p style={{ color: '#cccccc', fontSize: '16px', margin: 0 }}>
          AI-generated recommendations for the most effective research approaches based on your idea.
        </p>
      </div>
      
      <div style={{ display: 'grid', gap: '20px' }}>
        {lensData.map((lens, index) => (
          <div key={index} style={{ 
            backgroundColor: '#2c2c3e', 
            padding: '24px', 
            borderRadius: '12px',
            border: `2px solid ${index === 0 ? '#8A5CF6' : index === 1 ? '#28a745' : '#ffc107'}`,
            boxShadow: `0 4px 12px ${index === 0 ? 'rgba(138, 92, 246, 0.2)' : index === 1 ? 'rgba(40, 167, 69, 0.2)' : 'rgba(255, 193, 7, 0.2)'}`,
            position: 'relative'
          }}>
            {/* Rank Badge */}
            <div style={{
              position: 'absolute',
              top: '-10px',
              left: '20px',
              backgroundColor: index === 0 ? '#8A5CF6' : index === 1 ? '#28a745' : '#ffc107',
              color: 'white',
              padding: '6px 12px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: 'bold'
            }}>
              #{lens.rank || index + 1} RECOMMENDED
            </div>

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', marginTop: '8px' }}>
              <h4 style={{ 
                color: index === 0 ? '#8A5CF6' : index === 1 ? '#28a745' : '#ffc107', 
                margin: 0, 
                fontSize: '20px',
                fontWeight: 'bold'
              }}>
                🎯 {lens.lens || 'SME (Subject Matter Expert)'}
              </h4>
              {lens.confidence && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ 
                    backgroundColor: lens.confidence > 0.8 ? '#28a745' : lens.confidence > 0.6 ? '#ffc107' : '#dc3545',
                    color: 'white',
                    padding: '4px 12px',
                    borderRadius: '16px',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    {Math.round(lens.confidence * 100)}% CONFIDENCE
                  </span>
                </div>
              )}
            </div>
            
            {/* Reason */}
            {lens.reason && (
              <div style={{ 
                backgroundColor: '#1a1a2e',
                padding: '16px',
                borderRadius: '8px',
                marginBottom: '16px',
                border: '1px solid #444'
              }}>
                <div style={{ color: '#e0e0e0', fontSize: '16px', lineHeight: '1.6' }}>
                  <strong style={{ color: '#8A5CF6' }}>Why this lens:</strong><br/>
                  {lens.reason}
                </div>
              </div>
            )}

            {/* Metrics Grid */}
            {(lens.predicted_responses || lens.success_probability || lens.estimated_timeline) && (
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
                gap: '16px',
                backgroundColor: '#1a1a2e',
                padding: '16px',
                borderRadius: '8px',
                border: '1px solid #444'
              }}>
                {lens.predicted_responses && (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', marginBottom: '4px' }}>📊</div>
                    <div style={{ 
                      fontSize: '20px', 
                      fontWeight: 'bold', 
                      color: '#8A5CF6',
                      marginBottom: '4px'
                    }}>
                      {lens.predicted_responses}
                    </div>
                    <div style={{ color: '#cccccc', fontSize: '12px' }}>Expected Responses</div>
                  </div>
                )}
                {lens.success_probability && (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', marginBottom: '4px' }}>🎯</div>
                    <div style={{ 
                      fontSize: '20px', 
                      fontWeight: 'bold', 
                      color: '#28a745',
                      marginBottom: '4px'
                    }}>
                      {Math.round(lens.success_probability * 100)}%
                    </div>
                    <div style={{ color: '#cccccc', fontSize: '12px' }}>Success Rate</div>
                  </div>
                )}
                {lens.estimated_timeline && (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', marginBottom: '4px' }}>⏰</div>
                    <div style={{ 
                      fontSize: '20px', 
                      fontWeight: 'bold', 
                      color: '#ffc107',
                      marginBottom: '4px'
                    }}>
                      {lens.estimated_timeline}
                    </div>
                    <div style={{ color: '#cccccc', fontSize: '12px' }}>Timeline</div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Summary Footer */}
      <div style={{ 
        backgroundColor: '#2c2c3e', 
        padding: '20px', 
        borderRadius: '12px',
        marginTop: '20px',
        border: '1px solid #8A5CF6',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '20px', marginBottom: '8px' }}>🚀</div>
        <h4 style={{ color: '#8A5CF6', margin: '0 0 8px 0' }}>Ready to Start Research?</h4>
        <p style={{ color: '#cccccc', margin: 0, fontSize: '14px' }}>
          These recommendations are ranked by AI confidence and potential impact for your specific idea.
        </p>
      </div>

      {/* Debug section - remove this once everything works */}
      <div style={{ 
        backgroundColor: '#2a2a2a', 
        padding: '16px', 
        borderRadius: '8px', 
        border: '1px solid #444',
        marginTop: '20px'
      }}>
        <h4 style={{ color: '#8A5CF6', marginBottom: '8px' }}>🔍 Debug: Parsed Lens Data</h4>
        <pre style={{ 
          color: '#cccccc', 
          fontSize: '12px', 
          lineHeight: '1.4',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          maxHeight: '200px',
          overflowY: 'auto'
        }}>
          {JSON.stringify(lensData, null, 2)}
        </pre>
      </div>
    </div>
  );
};

    const renderGeneratedSurvey = (data) => {
      if (!data) return null;

      return (
        <div style={{ color: '#ffffff' }}>
          <h3 style={{ color: '#8A5CF6', marginBottom: '16px' }}>📊 Generated Survey</h3>
          
          {data.title && (
            <div style={{ 
              backgroundColor: '#2a2a2a', 
              padding: '16px', 
              borderRadius: '8px', 
              marginBottom: '16px',
              border: '1px solid #444'
            }}>
              <h4 style={{ color: '#8A5CF6', marginBottom: '8px' }}>Survey Title</h4>
              <p style={{ color: '#cccccc', fontSize: '16px', fontWeight: '600' }}>{data.title}</p>
            </div>
          )}

          {data.description && (
            <div style={{ 
              backgroundColor: '#2a2a2a', 
              padding: '16px', 
              borderRadius: '8px', 
              marginBottom: '16px',
              border: '1px solid #444'
            }}>
              <h4 style={{ color: '#8A5CF6', marginBottom: '8px' }}>Description</h4>
              <p style={{ color: '#cccccc', lineHeight: '1.5' }}>{data.description}</p>
            </div>
          )}

          {data.questions && data.questions.length > 0 && (
            <div style={{ 
              backgroundColor: '#2a2a2a', 
              padding: '16px', 
              borderRadius: '8px', 
              marginBottom: '16px',
              border: '1px solid #444'
            }}>
              <h4 style={{ color: '#8A5CF6', marginBottom: '16px' }}>Questions ({data.questions.length})</h4>
              {data.questions.map((question, index) => (
                <div key={index} style={{ 
                  backgroundColor: '#3a3a3a', 
                  padding: '12px', 
                  borderRadius: '6px', 
                  marginBottom: '12px',
                  border: '1px solid #555'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <h5 style={{ color: '#ffffff', margin: 0, flex: 1 }}>
                      Q{index + 1}. {question.question || question.text}
                    </h5>
                    {question.type && (
                      <span style={{ 
                        backgroundColor: '#6c757d',
                        color: 'white',
                        padding: '2px 6px',
                        borderRadius: '8px',
                        fontSize: '10px',
                        marginLeft: '8px'
                      }}>
                        {question.type}
                      </span>
                    )}
                  </div>
                  
                  {question.options && question.options.length > 0 && (
                    <div style={{ marginTop: '8px' }}>
                      <strong style={{ color: '#ffffff', fontSize: '14px' }}>Options:</strong>
                      <ul style={{ color: '#cccccc', paddingLeft: '20px', marginTop: '4px' }}>
                        {question.options.map((option, optIndex) => (
                          <li key={optIndex} style={{ marginBottom: '2px' }}>{option}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {question.purpose && (
                    <div style={{ marginTop: '8px' }}>
                      <strong style={{ color: '#ffffff', fontSize: '12px' }}>Purpose:</strong>
                      <p style={{ color: '#cccccc', fontSize: '12px', margin: '4px 0 0 0' }}>{question.purpose}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {data.targetAudience && (
            <div style={{ 
              backgroundColor: '#2a2a2a', 
              padding: '16px', 
              borderRadius: '8px', 
              marginBottom: '16px',
              border: '1px solid #444'
            }}>
              <h4 style={{ color: '#8A5CF6', marginBottom: '8px' }}>🎯 Target Audience</h4>
              <p style={{ color: '#cccccc' }}>{data.targetAudience}</p>
            </div>
          )}

          {data.estimatedDuration && (
            <div style={{ 
              backgroundColor: '#2a2a2a', 
              padding: '16px', 
              borderRadius: '8px', 
              marginBottom: '16px',
              border: '1px solid #444'
            }}>
              <h4 style={{ color: '#8A5CF6', marginBottom: '8px' }}>⏰ Estimated Duration</h4>
              <p style={{ color: '#cccccc' }}>{data.estimatedDuration}</p>
            </div>
          )}
        </div>
      );
    };

    const renderGenericJSON = (data) => {
      return (
        <div style={{ color: '#ffffff' }}>
          <h3 style={{ color: '#8A5CF6', marginBottom: '16px' }}>📄 AI Generated Content</h3>
          <div style={{ 
            backgroundColor: '#2a2a2a', 
            padding: '16px', 
            borderRadius: '8px', 
            border: '1px solid #444'
          }}>
            <pre style={{ 
              color: '#cccccc', 
              fontSize: '14px', 
              lineHeight: '1.4',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word'
            }}>
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        </div>
      );
    };

    const renderContent = () => {
      if (!content) return null;

      switch (contentType) {
        case 'idea_analysis':
          return renderIdeaAnalysis(content);
        case 'lens_recommendations':
          return renderLensRecommendations(content);
        case 'generated_survey':
          return renderGeneratedSurvey(content);
        default:
          return renderGenericJSON(content);
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
        zIndex: 1000,
        padding: '20px'
      }}>
        <div style={{
          backgroundColor: '#1a1a1a',
          color: '#ffffff',
          borderRadius: '12px',
          width: '90%',
          maxWidth: '800px',
          maxHeight: '90vh',
          overflow: 'hidden',
          border: '2px solid #8A5CF6'
        }}>
          {/* Header */}
          <div style={{
            padding: '20px',
            borderBottom: '1px solid #444',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#2a2a2a'
          }}>
            <h2 style={{ margin: 0, color: '#8A5CF6' }}>
              {contentType === 'idea_analysis' && '🧠 Idea Analysis'}
              {contentType === 'lens_recommendations' && '🔍 Lens Recommendations'}
              {contentType === 'generated_survey' && '📊 Generated Survey'}
              {!['idea_analysis', 'lens_recommendations', 'generated_survey'].includes(contentType) && '📄 AI Content'}
            </h2>
            <button
              onClick={onClose}
              style={{
                backgroundColor: 'transparent',
                color: '#ffffff',
                border: '1px solid #666',
                borderRadius: '6px',
                padding: '8px 16px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              ✕ Close
            </button>
          </div>

          {/* Content */}
          <div style={{ 
            padding: '20px', 
            maxHeight: 'calc(90vh - 80px)', 
            overflowY: 'auto'
          }}>
            {loading && (
              <div style={{ textAlign: 'center', padding: '40px', color: '#ffffff' }}>
                Loading content...
              </div>
            )}
            
            {error && (
              <div style={{ 
                backgroundColor: '#f8d7da', 
                color: '#721c24', 
                padding: '12px', 
                borderRadius: '6px',
                border: '1px solid #f5c6cb'
              }}>
                {error}
              </div>
            )}
            
            {!loading && !error && renderContent()}
          </div>
        </div>
      </div>
    );
  };

  // Analytics Dashboard Component
  const AnalyticsDashboard = () => {
    return (
      <div style={{ 
        backgroundColor: '#2a2a2a', 
        padding: '16px', 
        borderRadius: '8px',
        textAlign: 'center',
        marginBottom: '24px',
        border: '1px solid #8A5CF6'
      }}>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '24px', color: '#8A5CF6' }}>
          {ideas.length || 0}
        </h3>
        <p style={{ margin: 0, color: '#cccccc' }}>Total Ideas</p>
      </div>
    );
  };

  // Detailed view for selected idea
  if (selectedIdea) {
    return (
      <div style={{ padding: '20px', backgroundColor: '#1a1a1a', color: '#ffffff', minHeight: '100vh' }}>
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
            <button 
              onClick={() => handleAction('delete', selectedIdea.id)}
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
              {actionLoading === selectedIdea.id ? 'Deleting...' : 'Delete Idea'}
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
          {/* Main content */}
          <div>
            <h2 style={{ marginBottom: '16px', color: '#8A5CF6' }}>{selectedIdea.name}</h2>
            <p style={{ color: '#cccccc', marginBottom: '16px', lineHeight: '1.5' }}>
              {selectedIdea.description}
            </p>
            
            {/* Basic Information */}
            <div style={{ 
              backgroundColor: '#2a2a2a', 
              padding: '20px', 
              borderRadius: '8px',
              marginBottom: '24px',
              border: '1px solid #444'
            }}>
              <h3 style={{ marginBottom: '16px', color: '#8A5CF6' }}>Basic Information</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <strong style={{ color: '#ffffff' }}>ID:</strong> <span style={{ color: '#cccccc' }}>{selectedIdea.id}</span>
                </div>
                <div>
                  <strong style={{ color: '#ffffff' }}>User ID:</strong> <span style={{ color: '#cccccc' }}>{selectedIdea.user_id}</span>
                </div>
                <div>
                  <strong style={{ color: '#ffffff' }}>Target Audience:</strong> <span style={{ color: '#cccccc' }}>{selectedIdea.targeted_audience}</span>
                </div>
                <div>
                  <strong style={{ color: '#ffffff' }}>AI Request ID:</strong> <span style={{ color: '#cccccc' }}>{selectedIdea.ai_request_id || 'Not available'}</span>
                </div>
                <div>
                  <strong style={{ color: '#ffffff' }}>Created:</strong> <span style={{ color: '#cccccc' }}>{formatDate(selectedIdea.created_at)}</span>
                </div>
                <div>
                  <strong style={{ color: '#ffffff' }}>Updated:</strong> <span style={{ color: '#cccccc' }}>{formatDate(selectedIdea.updated_at)}</span>
                </div>
              </div>
            </div>

            {/* Attachments */}
            <div style={{ 
              backgroundColor: '#2a2a2a', 
              padding: '20px', 
              borderRadius: '8px',
              marginBottom: '24px',
              border: '1px solid #444'
            }}>
              <h3 style={{ marginBottom: '16px', color: '#8A5CF6' }}>Attachments</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <strong style={{ color: '#ffffff' }}>Pitch Deck:</strong><br/>
                  {selectedIdea.pitch_deck ? (
                    <a href={selectedIdea.pitch_deck} target="_blank" rel="noopener noreferrer" 
                       style={{ color: '#8A5CF6', textDecoration: 'none' }}>
                      📄 View Pitch Deck
                    </a>
                  ) : (
                    <span style={{ color: '#6c757d' }}>Not uploaded</span>
                  )}
                </div>
                <div>
                  <strong style={{ color: '#ffffff' }}>Voice Note:</strong><br/>
                  {selectedIdea.voice_note ? (
                    <a href={selectedIdea.voice_note} target="_blank" rel="noopener noreferrer" 
                       style={{ color: '#8A5CF6', textDecoration: 'none' }}>
                      🎵 Play Voice Note
                    </a>
                  ) : (
                    <span style={{ color: '#6c757d' }}>Not uploaded</span>
                  )}
                </div>
                <div>
                  <strong style={{ color: '#ffffff' }}>Document:</strong><br/>
                  {selectedIdea.document ? (
                    <a href={selectedIdea.document} target="_blank" rel="noopener noreferrer" 
                       style={{ color: '#8A5CF6', textDecoration: 'none' }}>
                      📋 View Document
                    </a>
                  ) : (
                    <span style={{ color: '#6c757d' }}>Not uploaded</span>
                  )}
                </div>
                <div>
                  <strong style={{ color: '#ffffff' }}>Voice Transcript:</strong><br/>
                  {selectedIdea.voice_note_transcript ? (
                    <a href={selectedIdea.voice_note_transcript} target="_blank" rel="noopener noreferrer" 
                       style={{ color: '#8A5CF6', textDecoration: 'none' }}>
                      📝 View Transcript
                    </a>
                  ) : (
                    <span style={{ color: '#6c757d' }}>Not available</span>
                  )}
                </div>
              </div>
            </div>

            {/* AI Generated Content */}
            <div style={{ 
              backgroundColor: '#2a2a2a', 
              padding: '20px', 
              borderRadius: '8px',
              marginBottom: '24px',
              border: '1px solid #444'
            }}>
              <h3 style={{ marginBottom: '16px', color: '#8A5CF6' }}>AI Generated Content</h3>
              {renderAILinks(selectedIdea, true)}
            </div>
          </div>

          {/* Sidebar */}
          <div>
            <div style={{ 
              backgroundColor: '#2a2a2a', 
              padding: '16px', 
              borderRadius: '8px',
              marginBottom: '16px',
              border: '1px solid #444'
            }}>
              <h4 style={{ marginBottom: '12px', color: '#8A5CF6' }}>Current Status</h4>
              <div style={{ marginBottom: '12px' }}>
                <span style={getStatusBadge(selectedIdea.status)}>{selectedIdea.status}</span>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <span style={getStageBadge(selectedIdea.stage)}>{selectedIdea.stage}</span>
              </div>
            </div>

            {/* Admin Controls */}
            <div style={{ 
              backgroundColor: '#2a2a2a', 
              padding: '16px', 
              borderRadius: '8px',
              marginBottom: '16px',
              border: '1px solid #444'
            }}>
              <h4 style={{ marginBottom: '12px', color: '#8A5CF6' }}>Change Status</h4>
              <select 
                onChange={(e) => {
                  if (e.target.value) {
                    handleAction('updateStatus', selectedIdea.id, e.target.value);
                    e.target.value = '';
                  }
                }}
                style={{ 
                  width: '100%', 
                  padding: '8px', 
                  border: '1px solid #444', 
                  borderRadius: '4px',
                  marginBottom: '12px',
                  backgroundColor: '#1a1a1a',
                  color: '#ffffff'
                }}
                disabled={actionLoading === selectedIdea.id}
              >
                <option value="">Select Status...</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="in progress">In Progress</option>
              </select>
            </div>

            <div style={{ 
              backgroundColor: '#2a2a2a', 
              padding: '16px', 
              borderRadius: '8px',
              border: '1px solid #444'
            }}>
              <h4 style={{ marginBottom: '12px', color: '#8A5CF6' }}>Change Stage</h4>
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
                  border: '1px solid #444', 
                  borderRadius: '4px',
                  backgroundColor: '#1a1a1a',
                  color: '#ffffff'
                }}
                disabled={actionLoading === selectedIdea.id}
              >
                <option value="">Select Stage...</option>
                <option value="IDEATION & PLANNING">Planning & Ideation</option>
                <option value="TESTING">Testing</option>
                <option value="BETA">Beta</option>
                <option value="PROTOTYPE">Prototype</option>
              </select>
            </div>
          </div>
        </div>

        {/* ADD THE MODAL HERE FOR DETAIL VIEW */}
        {aiContentViewer.show && (
          <AIContentViewer
            contentType={aiContentViewer.type}
            url={aiContentViewer.url}
            onClose={() => setAiContentViewer({ show: false, type: '', url: '' })}
          />
        )}
      </div>
    );
  }

  // Main Ideas List View
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#1a1a1a', color: '#ffffff', padding: '32px' }}>
      <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '32px', color: '#8A5CF6' }}>Ideas & Studies</h1>
      
      {/* Analytics Dashboard */}
      <AnalyticsDashboard />
      
      {/* Filters and Search */}
      <div style={{ 
        backgroundColor: '#2a2a2a', 
        border: '1px solid #8A5CF6', 
        borderRadius: '8px',
        padding: '24px', 
        marginBottom: '32px', 
        display: 'flex', 
        alignItems: 'center', 
        gap: '24px' 
      }}>
        <input
          type="text"
          placeholder="Search ideas..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={{
            backgroundColor: '#1a1a1a',
            color: '#8A5CF6',
            border: '1px solid #8A5CF6',
            borderRadius: '8px',
            padding: '8px 16px',
            outline: 'none'
          }}
        />
        <select
          value={selectedStage}
          onChange={e => setSelectedStage(e.target.value)}
          style={{
            backgroundColor: '#1a1a1a',
            color: '#8A5CF6',
            border: '1px solid #8A5CF6',
            borderRadius: '8px',
            padding: '8px 16px',
            outline: 'none'
          }}
        >
          <option value="all">All Stages</option>
          <option value="IDEATION & PLANNING">Planning & Ideation</option>
          <option value="TESTING">Testing</option>
          <option value="BETA">Beta</option>
          <option value="PROTOTYPE">Prototype</option>
        </select>
        <select
          value={selectedStatus}
          onChange={e => setSelectedStatus(e.target.value)}
          style={{
            backgroundColor: '#1a1a1a',
            color: '#8A5CF6',
            border: '1px solid #8A5CF6',
            borderRadius: '8px',
            padding: '8px 16px',
            outline: 'none'
          }}
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="in progress">In Progress</option>
        </select>
      </div>
      
      {/* Error Message */}
      {error && (
        <div style={{ 
          backgroundColor: '#f8d7da', 
          color: '#721c24', 
          padding: '12px', 
          borderRadius: '6px',
          marginBottom: '16px',
          border: '1px solid #f5c6cb'
        }}>
          {error}
        </div>
      )}
      
      {/* Ideas Table/Card List */}
      <div style={{ 
        backgroundColor: '#2a2a2a', 
        border: '1px solid #8A5CF6', 
        borderRadius: '8px',
        padding: '24px' 
      }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#ffffff' }}>Loading ideas...</div>
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
                backgroundColor: '#3a3a3a',
                borderRadius: '8px',
                color: '#ffffff'
              }}>
                No ideas found matching your criteria.
              </div>
            ) : (
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', 
                gap: '20px' 
              }}>
                {filteredIdeas.map(idea => (
                  <div
                    key={idea.id}
                    style={{
                      border: '1px solid #444',
                      borderRadius: '8px',
                      backgroundColor: '#3a3a3a',
                      color: '#ffffff',
                      padding: '20px',
                      cursor: 'pointer',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 4px 8px rgba(138,92,246,0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
                    }}
                    onClick={() => setSelectedIdea(idea)}
                  >
                    {/* Header */}
                    <div style={{ marginBottom: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <h3 style={{ margin: '0', fontSize: '18px', lineHeight: '1.3', flex: 1 }}>
                          {idea.name}
                        </h3>
                        <span style={{ fontSize: '12px', color: '#6c757d', marginLeft: '8px' }}>
                          ID: {idea.id}
                        </span>
                      </div>
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
                    
                    {/* Creator & Audience Info */}
                    <div style={{ marginBottom: '12px' }}>
                      <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '4px' }}>
                        <strong>Creator ID:</strong> {idea.user_id}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6c757d' }}>
                        <strong>Target:</strong> {idea.targeted_audience}
                      </div>
                    </div>

                    {/* Status & Stage Badges */}
                    <div style={{ marginBottom: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={getStatusBadge(idea.status)}>{idea.status}</span>
                      <span style={getStageBadge(idea.stage)}>{idea.stage}</span>
                    </div>

                    {/* Attachments */}
                    <div style={{ marginBottom: '12px' }}>
                      <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '4px' }}>
                        <strong>Attachments:</strong>
                      </div>
                      {renderAttachments(idea)}
                    </div>

                    {/* AI Content Preview */}
                    <div style={{ marginBottom: '12px' }}>
                      <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '4px' }}>
                        <strong>AI Generated:</strong>
                      </div>
                      {renderAILinks(idea, false)}
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
                          handleAction('delete', idea.id);
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
                        {actionLoading === idea.id ? 'Loading...' : 'Delete'}
                      </button>
                      
                      <select
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => {
                          if (e.target.value) {
                            handleAction('updateStatus', idea.id, e.target.value);
                            e.target.value = '';
                          }
                        }}
                        style={{ 
                          flex: 1,
                          padding: '6px 8px', 
                          border: '1px solid #ced4da', 
                          borderRadius: '4px',
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                        disabled={actionLoading === idea.id}
                      >
                        <option value="">Status...</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="in progress">In Progress</option>
                      </select>
                    </div>

                    <div style={{ 
                      fontSize: '11px', 
                      color: '#6c757d',
                      marginTop: '8px',
                      textAlign: 'center'
                    }}>
                      Created: {formatDate(idea.created_at)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ADD THE MODAL HERE FOR MAIN VIEW */}
      {aiContentViewer.show && (
        <AIContentViewer
          contentType={aiContentViewer.type}
          url={aiContentViewer.url}
          onClose={() => setAiContentViewer({ show: false, type: '', url: '' })}
        />
      )}
    </div>
  );
};

export default IdeasStudies;