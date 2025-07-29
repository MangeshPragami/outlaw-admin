import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { getFormsOverview } from '../services/api';

const Surveys = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSurvey, setSelectedSurvey] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { token } = useContext(AuthContext);

  useEffect(() => {
    const fetchSurveys = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await getFormsOverview(token);
        setSurveys(data); // Adjust if API returns { forms: [...] }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchSurveys();
  }, [token]);

  const filteredSurveys = surveys.filter(survey =>
    survey.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    survey.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleViewSurvey = (survey) => {
    setSelectedSurvey(survey);
    setActiveTab('overview');
  };

  const handleBackToList = () => {
    setSelectedSurvey(null);
  };

  const getStatusBadge = (status) => {
    const baseStyle = {
      padding: '4px 12px',
      borderRadius: '12px',
      fontSize: '12px',
      fontWeight: '600',
      textTransform: 'uppercase'
    };
    
    if (status === 'Active') {
      return { ...baseStyle, backgroundColor: '#d4edda', color: '#155724' };
    } else {
      return { ...baseStyle, backgroundColor: '#d1ecf1', color: '#0c5460' };
    }
  };

  if (selectedSurvey) {
    return (
      <div style={{ padding: '20px', height: '100%' }}>
        <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
          <button 
            onClick={handleBackToList}
            style={{
              background: 'none',
              border: '1px solid #dee2e6',
              borderRadius: '6px',
              padding: '8px 12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '14px',
              color: '#495057'
            }}
          >
            ← Back to Surveys
          </button>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '600', color: '#495057', margin: 0 }}>
              {selectedSurvey.title}
            </h1>
            <p style={{ color: '#6c757d', fontSize: '14px', margin: '5px 0 0 0' }}>
              {selectedSurvey.description}
            </p>
          </div>
        </div>

        {/* Survey Info Panel */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          border: '1px solid #e3e6f0',
          padding: '20px',
          marginBottom: '20px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
            <div>
              <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '5px' }}>STATUS</div>
              <span style={getStatusBadge(selectedSurvey.status)}>{selectedSurvey.status}</span>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '5px' }}>SENT TO</div>
              <div style={{ fontSize: '18px', fontWeight: '600', color: '#495057' }}>{selectedSurvey.sentTo} people</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '5px' }}>RESPONSES</div>
              <div style={{ fontSize: '18px', fontWeight: '600', color: '#495057' }}>
                {selectedSurvey.responses}/{selectedSurvey.sentTo} ({selectedSurvey.completionRate}%)
              </div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '5px' }}>CREATED</div>
              <div style={{ fontSize: '18px', fontWeight: '600', color: '#495057' }}>{selectedSurvey.createdDate}</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          border: '1px solid #e3e6f0',
          minHeight: '400px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
        }}>
          <div style={{
            borderBottom: '1px solid #e3e6f0',
            display: 'flex',
            gap: '0'
          }}>
            {['overview', 'responses', 'analytics', 'content'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '15px 25px',
                  border: 'none',
                  background: activeTab === tab ? '#f8f9fa' : 'transparent',
                  borderBottom: activeTab === tab ? '2px solid #007bff' : '2px solid transparent',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: activeTab === tab ? '#007bff' : '#6c757d',
                  textTransform: 'capitalize'
                }}
              >
                {tab === 'overview' && '📊 Overview'}
                {tab === 'responses' && '📝 Responses'}
                {tab === 'analytics' && '🔍 Analytics'}
                {tab === 'content' && '📋 Survey Content'}
              </button>
            ))}
          </div>

          <div style={{ padding: '30px' }}>
            {activeTab === 'overview' && (
              <div>
                <h3 style={{ marginBottom: '30px', color: '#495057' }}>Survey Overview</h3>
                
                {/* Main Stats Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                  {/* Completion Rate Card with Progress Bar */}
                  <div style={{ 
                    padding: '25px', 
                    backgroundColor: 'white', 
                    borderRadius: '12px', 
                    border: '1px solid #e3e6f0',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '15px' }}>
                      <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#28a745' }}>
                        {selectedSurvey.completionRate}%
                      </div>
                      <div style={{
                        width: '50px',
                        height: '50px',
                        borderRadius: '50%',
                        background: `conic-gradient(#28a745 0deg ${selectedSurvey.completionRate * 3.6}deg, #e9ecef ${selectedSurvey.completionRate * 3.6}deg 360deg)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        color: '#28a745'
                      }}>
                        {selectedSurvey.completionRate}%
                      </div>
                    </div>
                    <div style={{ color: '#6c757d', marginBottom: '15px' }}>Completion Rate</div>
                    <div style={{
                      width: '100%',
                      height: '8px',
                      backgroundColor: '#e9ecef',
                      borderRadius: '4px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${selectedSurvey.completionRate}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, #28a745, #20c997)',
                        borderRadius: '4px',
                        transition: 'width 1s ease-in-out'
                      }}></div>
                    </div>
                  </div>

                  {/* Total Responses Card */}
                  <div style={{ 
                    padding: '25px', 
                    backgroundColor: 'white', 
                    borderRadius: '12px', 
                    border: '1px solid #e3e6f0',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                  }}>
                    <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#007bff', marginBottom: '10px' }}>
                      {selectedSurvey.responses}
                    </div>
                    <div style={{ color: '#6c757d', marginBottom: '10px' }}>Total Responses</div>
                    <div style={{ fontSize: '14px', color: '#28a745' }}>
                      ↗ +3 in last 24h
                    </div>
                  </div>

                  {/* Pending Responses Card */}
                  <div style={{ 
                    padding: '25px', 
                    backgroundColor: 'white', 
                    borderRadius: '12px', 
                    border: '1px solid #e3e6f0',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                  }}>
                    <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#ffc107', marginBottom: '10px' }}>
                      {selectedSurvey.sentTo - selectedSurvey.responses}
                    </div>
                    <div style={{ color: '#6c757d', marginBottom: '10px' }}>Pending Responses</div>
                    <div style={{
                      width: '100%',
                      height: '6px',
                      backgroundColor: '#e9ecef',
                      borderRadius: '3px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${((selectedSurvey.sentTo - selectedSurvey.responses) / selectedSurvey.sentTo) * 100}%`,
                        height: '100%',
                        backgroundColor: '#ffc107',
                        borderRadius: '3px'
                      }}></div>
                    </div>
                  </div>

                  {/* Response Rate Indicator */}
                  <div style={{ 
                    padding: '25px', 
                    backgroundColor: 'white', 
                    borderRadius: '12px', 
                    border: '1px solid #e3e6f0',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                  }}>
                    <div style={{ 
                      fontSize: '16px', 
                      fontWeight: 'bold', 
                      color: selectedSurvey.completionRate >= 70 ? '#28a745' : selectedSurvey.completionRate >= 50 ? '#ffc107' : '#dc3545',
                      marginBottom: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      {selectedSurvey.completionRate >= 70 ? '🟢 Excellent' : selectedSurvey.completionRate >= 50 ? '🟡 Good' : '🔴 Needs Attention'}
                    </div>
                    <div style={{ color: '#6c757d' }}>Response Health</div>
                  </div>
                </div>

                {/* Response Timeline Chart */}
                <div style={{
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  border: '1px solid #e3e6f0',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  padding: '25px',
                  marginBottom: '30px'
                }}>
                  <h4 style={{ margin: '0 0 20px 0', color: '#495057' }}>📈 Response Timeline</h4>
                  <div style={{ position: 'relative', height: '200px', display: 'flex', alignItems: 'end', gap: '8px', padding: '0 10px' }}>
                    {[2, 5, 8, 12, 15, 18, 22, 28, 30, 32].map((responses, index) => {
                      const height = (responses / 32) * 160;
                      const isToday = index === 9;
                      return (
                        <div key={index} style={{ 
                          display: 'flex', 
                          flexDirection: 'column', 
                          alignItems: 'center',
                          flex: 1
                        }}>
                          <div style={{
                            width: '100%',
                            maxWidth: '30px',
                            height: `${height}px`,
                            backgroundColor: isToday ? '#007bff' : '#e3f2fd',
                            borderRadius: '4px',
                            marginBottom: '8px',
                            transition: 'all 0.3s ease',
                            position: 'relative'
                          }}>
                            {isToday && (
                              <div style={{
                                position: 'absolute',
                                top: '-25px',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                fontSize: '12px',
                                fontWeight: 'bold',
                                color: '#007bff'
                              }}>
                                {responses}
                              </div>
                            )}
                          </div>
                          <div style={{ 
                            fontSize: '11px', 
                            color: '#6c757d',
                            fontWeight: isToday ? 'bold' : 'normal'
                          }}>
                            Jan {15 + index}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ 
                    marginTop: '15px', 
                    fontSize: '14px', 
                    color: '#6c757d',
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '20px'
                  }}>
                    <span>📅 Last 10 days</span>
                    <span>📊 Peak: Jan 24 (4 responses)</span>
                  </div>
                </div>

                {/* Mini Donut Charts Section */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: '20px'
                }}>
                  <div style={{
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    border: '1px solid #e3e6f0',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    padding: '25px',
                    textAlign: 'center'
                  }}>
                    <h4 style={{ margin: '0 0 20px 0', color: '#495057' }}>🎯 Completion Status</h4>
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                      <div style={{
                        width: '120px',
                        height: '120px',
                        borderRadius: '50%',
                        background: `conic-gradient(#28a745 0deg ${selectedSurvey.completionRate * 3.6}deg, #e9ecef ${selectedSurvey.completionRate * 3.6}deg 360deg)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 15px auto'
                      }}>
                        <div style={{
                          width: '80px',
                          height: '80px',
                          backgroundColor: 'white',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '18px',
                          fontWeight: 'bold',
                          color: '#28a745'
                        }}>
                          {selectedSurvey.completionRate}%
                        </div>
                      </div>
                    </div>
                    <div style={{ color: '#6c757d', fontSize: '14px' }}>
                      {selectedSurvey.responses} of {selectedSurvey.sentTo} completed
                    </div>
                  </div>

                  <div style={{
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    border: '1px solid #e3e6f0',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    padding: '25px',
                    textAlign: 'center'
                  }}>
                    <h4 style={{ margin: '0 0 20px 0', color: '#495057' }}>⭐ Response Quality</h4>
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                      <div style={{
                        width: '120px',
                        height: '120px',
                        borderRadius: '50%',
                        background: 'conic-gradient(#28a745 0deg 252deg, #ffc107 252deg 288deg, #dc3545 288deg 360deg)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 15px auto'
                      }}>
                        <div style={{
                          width: '80px',
                          height: '80px',
                          backgroundColor: 'white',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '14px',
                          fontWeight: 'bold',
                          color: '#495057'
                        }}>
                          High
                        </div>
                      </div>
                    </div>
                    <div style={{ fontSize: '12px', color: '#6c757d' }}>
                      <div style={{ color: '#28a745' }}>🟢 Complete: 70%</div>
                      <div style={{ color: '#ffc107' }}>🟡 Partial: 20%</div>
                      <div style={{ color: '#dc3545' }}>🔴 Incomplete: 10%</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'responses' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                  <h3 style={{ margin: 0, color: '#495057' }}>Individual Responses</h3>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <select style={{
                      padding: '8px 12px',
                      border: '1px solid #ced4da',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}>
                      <option>All Responses</option>
                      <option>Completed Only</option>
                      <option>Partial Responses</option>
                      <option>Recent (Last 7 days)</option>
                    </select>
                    <button style={{
                      padding: '8px 16px',
                      backgroundColor: '#007bff',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}>
                      Export All Responses
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {Array.from({ length: selectedSurvey.responses }, (_, i) => (
                    <div key={i} style={{
                      padding: '15px',
                      border: '1px solid #e3e6f0',
                      borderRadius: '6px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div>
                        <div style={{ fontWeight: '500' }}>Response #{i + 1}</div>
                        <div style={{ fontSize: '12px', color: '#6c757d' }}>
                          Completed on Jan {15 + Math.floor(i/3)}, 2025
                        </div>
                      </div>
                      <button style={{
                        padding: '6px 12px',
                        border: '1px solid #007bff',
                        backgroundColor: 'transparent',
                        color: '#007bff',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}>
                        View Details
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'analytics' && (
              <div>
                <h3 style={{ marginBottom: '20px', color: '#495057' }}>Analytics & Insights</h3>
                <div style={{ display: 'grid', gap: '20px' }}>
                  <div style={{ padding: '20px', border: '1px solid #e3e6f0', borderRadius: '8px' }}>
                    <h4 style={{ margin: '0 0 15px 0', color: '#495057' }}>📈 Key Metrics</h4>
                    <div style={{ color: '#6c757d', lineHeight: 1.6 }}>
                      • Average satisfaction score: 4.2/5.0<br/>
                      • 78% of respondents rated experience as "Good" or "Excellent"<br/>
                      • Response time: Average 3.2 minutes to complete
                    </div>
                  </div>
                  
                  <div style={{ padding: '20px', border: '1px solid #e3e6f0', borderRadius: '8px' }}>
                    <h4 style={{ margin: '0 0 15px 0', color: '#495057' }}>💬 Sentiment Analysis</h4>
                    <div style={{ color: '#6c757d', lineHeight: 1.6 }}>
                      • Positive: 68% • Neutral: 24% • Negative: 8%<br/>
                      • Most common positive themes: "Easy to use", "Great support"<br/>
                      • Areas for improvement: "Loading speed", "Mobile experience"
                    </div>
                  </div>
                  
                  <div style={{ padding: '20px', border: '1px solid #e3e6f0', borderRadius: '8px' }}>
                    <h4 style={{ margin: '0 0 15px 0', color: '#495057' }}>📄 Executive Summary</h4>
                    <div style={{ color: '#6c757d', lineHeight: 1.6 }}>
                      The survey indicates strong overall satisfaction with high completion rates. 
                      Users appreciate the core functionality but suggest improvements in performance 
                      and mobile optimization. Recommend prioritizing mobile experience enhancements.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'content' && (
              <div>
                <h3 style={{ marginBottom: '20px', color: '#495057' }}>Survey Questions</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {[
                    "How satisfied are you with our service overall?",
                    "How likely are you to recommend us to a friend?",
                    "What features do you use most frequently?",
                    "What improvements would you like to see?",
                    "How would you rate our customer support?"
                  ].map((question, i) => (
                    <div key={i} style={{
                      padding: '15px',
                      border: '1px solid #e3e6f0',
                      borderRadius: '6px',
                      backgroundColor: '#f8f9fa'
                    }}>
                      <div style={{ fontWeight: '500', marginBottom: '5px' }}>Question {i + 1}</div>
                      <div style={{ color: '#495057' }}>{question}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', height: '100%' }}>
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '600', color: '#495057', marginBottom: '8px' }}>
          📋 Surveys
        </h1>
        <p style={{ color: '#6c757d', fontSize: '14px' }}>
          View and analyze survey responses and insights
        </p>
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Search surveys by name or description..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            maxWidth: '400px',
            padding: '12px 16px',
            border: '1px solid #ced4da',
            borderRadius: '6px',
            fontSize: '14px',
            outline: 'none'
          }}
        />
      </div>

      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        border: '1px solid #e3e6f0',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
      }}>
        <div style={{
          padding: '20px',
          borderBottom: '1px solid #e3e6f0',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px 8px 0 0'
        }}>
          <h3 style={{ margin: 0, color: '#495057' }}>All Surveys ({filteredSurveys.length})</h3>
        </div>
        
        <div style={{ padding: '20px' }}>
          {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}
          {loading ? (
            <div>Loading surveys...</div>
          ) : (
            <div>
              {filteredSurveys.length === 0 ? (
                <div>No surveys found.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {filteredSurveys.map((survey) => (
                    <div key={survey.id} style={{
                      padding: '20px',
                      border: '1px solid #e3e6f0',
                      borderRadius: '8px',
                      transition: 'box-shadow 0.3s ease',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)'}
                    onMouseLeave={(e) => e.target.style.boxShadow = 'none'}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                            <h4 style={{ margin: 0, color: '#495057', fontSize: '18px' }}>
                              Survey #{survey.id}: {survey.title}
                            </h4>
                            <span style={getStatusBadge(survey.status)}>{survey.status}</span>
                          </div>
                          <p style={{ margin: '0 0 10px 0', color: '#6c757d', fontSize: '14px' }}>
                            {survey.description}
                          </p>
                          <div style={{ display: 'flex', gap: '20px', fontSize: '13px', color: '#6c757d' }}>
                            <span>Sent to: <strong>{survey.sentTo} people</strong></span>
                            <span>Responses: <strong>{survey.responses}/{survey.sentTo} ({survey.completionRate}%)</strong></span>
                            <span>Created: <strong>{survey.createdDate}</strong></span>
                          </div>
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                          onClick={() => handleViewSurvey(survey)}
                          style={{
                            padding: '8px 16px',
                            backgroundColor: '#007bff',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '14px'
                          }}
                        >
                          View Details
                        </button>
                        <button style={{
                          padding: '8px 16px',
                          backgroundColor: '#28a745',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '14px'
                        }}>
                          Analyze
                        </button>
                        <button style={{
                          padding: '8px 16px',
                          backgroundColor: 'transparent',
                          color: '#6c757d',
                          border: '1px solid #ced4da',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '14px'
                        }}>
                          Export
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Surveys;