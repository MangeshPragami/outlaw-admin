import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { getSMEOverview } from '../services/api';

const SMEInformation = () => {
  const [selectedSME, setSelectedSME] = useState(null);
  const [activeTab, setActiveTab] = useState('portfolio');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [timeFilter, setTimeFilter] = useState('week');
  const [smes, setSMEs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { token } = useContext(AuthContext);

  useEffect(() => {
    const fetchSMEs = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await getSMEOverview(token);
        setSMEs(data); // Adjust if API returns { smes: [...] }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchSMEs();
  }, [token]);

  const filteredSMEs = smes.filter(sme => {
    const matchesSearch = sme.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          sme.specializations.some(spec => spec.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = filterStatus === 'all' || sme.status.toLowerCase() === filterStatus.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status) => {
    const baseStyle = {
      padding: '4px 12px',
      borderRadius: '12px',
      fontSize: '12px',
      fontWeight: '600',
      textTransform: 'uppercase'
    };

    switch (status.toLowerCase()) {
      case 'active':
        return { ...baseStyle, backgroundColor: '#d4edda', color: '#155724' };
      case 'busy':
        return { ...baseStyle, backgroundColor: '#fff3cd', color: '#856404' };
      case 'inactive':
        return { ...baseStyle, backgroundColor: '#f8d7da', color: '#721c24' };
      default:
        return { ...baseStyle, backgroundColor: '#e2e3e5', color: '#383d41' };
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (selectedSME) {
    return (
      <div style={{ padding: '20px', height: '100%' }}>
        <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
          <button 
            onClick={() => setSelectedSME(null)}
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
            ← Back to SME List
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <img 
              src={selectedSME.avatar} 
              alt={selectedSME.name}
              style={{ width: '50px', height: '50px', borderRadius: '50%' }}
            />
            <div>
              <h1 style={{ fontSize: '28px', fontWeight: '600', color: '#495057', margin: 0 }}>
                {selectedSME.name}
              </h1>
              <p style={{ color: '#6c757d', fontSize: '14px', margin: '5px 0 0 0' }}>
                {selectedSME.specializations.join(' • ')}
              </p>
            </div>
          </div>
        </div>

        {/* SME Info Panel */}
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
              <span style={getStatusBadge(selectedSME.status)}>{selectedSME.status}</span>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '5px' }}>RATING</div>
              <div style={{ fontSize: '18px', fontWeight: '600', color: '#495057' }}>
                ⭐ {selectedSME.rating}/5.0
              </div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '5px' }}>TOTAL MEETINGS</div>
              <div style={{ fontSize: '18px', fontWeight: '600', color: '#495057' }}>
                {selectedSME.totalMeetings}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '5px' }}>JOINED</div>
              <div style={{ fontSize: '18px', fontWeight: '600', color: '#495057' }}>
                {new Date(selectedSME.joinedDate).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          border: '1px solid #e3e6f0',
          minHeight: '500px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
        }}>
          <div style={{
            borderBottom: '1px solid #e3e6f0',
            display: 'flex',
            gap: '0'
          }}>
            {['portfolio', 'meetings', 'hours'].map((tab) => (
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
                {tab === 'portfolio' && '💼 Portfolio'}
                {tab === 'meetings' && '📅 Scheduled Meetings'}
                {tab === 'hours' && '⏰ Working Hours'}
              </button>
            ))}
          </div>

          <div style={{ padding: '30px' }}>
            {activeTab === 'portfolio' && (
              <div>
                <h3 style={{ marginBottom: '20px', color: '#495057' }}>Portfolio & Experience</h3>
                
                {/* Experience Summary */}
                <div style={{
                  backgroundColor: '#f8f9fa',
                  borderRadius: '8px',
                  padding: '20px',
                  marginBottom: '25px'
                }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                    <div>
                      <h4 style={{ margin: '0 0 10px 0', color: '#495057' }}>Experience</h4>
                      <p style={{ margin: 0, color: '#6c757d' }}>{selectedSME.portfolio.experience}</p>
                    </div>
                    <div>
                      <h4 style={{ margin: '0 0 10px 0', color: '#495057' }}>Education</h4>
                      <p style={{ margin: 0, color: '#6c757d' }}>{selectedSME.portfolio.education}</p>
                    </div>
                  </div>
                </div>

                {/* Skills */}
                <div style={{ marginBottom: '25px' }}>
                  <h4 style={{ marginBottom: '15px', color: '#495057' }}>Core Skills</h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {selectedSME.portfolio.skills.map((skill, index) => (
                      <span key={index} style={{
                        padding: '6px 12px',
                        backgroundColor: '#e7f3ff',
                        color: '#004085',
                        borderRadius: '15px',
                        fontSize: '13px',
                        fontWeight: '500'
                      }}>
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Projects */}
                <div>
                  <h4 style={{ marginBottom: '15px', color: '#495057' }}>Recent Projects</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {selectedSME.portfolio.projects.map((project, index) => (
                      <div key={index} style={{
                        padding: '20px',
                        border: '1px solid #e3e6f0',
                        borderRadius: '8px',
                        backgroundColor: 'white'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                          <h5 style={{ margin: 0, color: '#495057', fontSize: '16px' }}>{project.name}</h5>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: '600',
                            backgroundColor: project.status === 'Completed' ? '#d4edda' : 
                                           project.status === 'In Progress' ? '#fff3cd' : '#f8d7da',
                            color: project.status === 'Completed' ? '#155724' : 
                                   project.status === 'In Progress' ? '#856404' : '#721c24'
                          }}>
                            {project.status}
                          </span>
                        </div>
                        <div style={{ fontSize: '14px', color: '#6c757d' }}>
                          Duration: {project.duration}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'meetings' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                  <h3 style={{ margin: 0, color: '#495057' }}>Scheduled Meetings</h3>
                  <button style={{
                    padding: '8px 16px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}>
                    Schedule New Meeting
                  </button>
                </div>

                {selectedSME.scheduledMeets.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    color: '#6c757d',
                    padding: '40px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '8px'
                  }}>
                    No upcoming meetings scheduled
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {selectedSME.scheduledMeets.map((meeting) => (
                      <div key={meeting.id} style={{
                        padding: '20px',
                        border: '1px solid #e3e6f0',
                        borderRadius: '8px',
                        backgroundColor: 'white'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                          <div>
                            <h5 style={{ margin: '0 0 8px 0', color: '#495057', fontSize: '16px' }}>
                              Meeting with {meeting.with}
                            </h5>
                            <div style={{ fontSize: '14px', color: '#6c757d', marginBottom: '5px' }}>
                              📋 {meeting.topic}
                            </div>
                            <div style={{ fontSize: '14px', color: '#6c757d' }}>
                              📅 {formatDate(`${meeting.date}T${meeting.time}`)} • ⏱ {meeting.duration}
                            </div>
                          </div>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: '600',
                            backgroundColor: meeting.status === 'Confirmed' ? '#d4edda' : '#fff3cd',
                            color: meeting.status === 'Confirmed' ? '#155724' : '#856404'
                          }}>
                            {meeting.status}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button style={{
                            padding: '6px 12px',
                            backgroundColor: '#007bff',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}>
                            Join Meeting
                          </button>
                          <button style={{
                            padding: '6px 12px',
                            backgroundColor: 'transparent',
                            color: '#6c757d',
                            border: '1px solid #ced4da',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}>
                            Reschedule
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'hours' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                  <h3 style={{ margin: 0, color: '#495057' }}>Working Hours Analytics</h3>
                  <select
                    value={timeFilter}
                    onChange={(e) => setTimeFilter(e.target.value)}
                    style={{
                      padding: '8px 12px',
                      border: '1px solid #ced4da',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  >
                    <option value="day">Today</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                  </select>
                </div>

                {/* Working Hours Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                  <div style={{
                    padding: '25px',
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    border: '1px solid #e3e6f0',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                  }}>
                    <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#007bff', marginBottom: '10px' }}>
                      {selectedSME.workingHours[timeFilter].hours}h
                    </div>
                    <div style={{ color: '#6c757d', marginBottom: '10px' }}>
                      Total Hours {timeFilter === 'day' ? 'Today' : `This ${timeFilter.charAt(0).toUpperCase() + timeFilter.slice(1)}`}
                    </div>
                    <div style={{ fontSize: '14px', color: '#28a745' }}>
                      {timeFilter === 'week' ? '↗ +2.5h from last week' : 
                       timeFilter === 'month' ? '↗ +15h from last month' : 
                       '📊 Peak productivity'}
                    </div>
                  </div>

                  <div style={{
                    padding: '25px',
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    border: '1px solid #e3e6f0',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                  }}>
                    <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#28a745', marginBottom: '10px' }}>
                      {selectedSME.workingHours[timeFilter].meetings}
                    </div>
                    <div style={{ color: '#6c757d', marginBottom: '10px' }}>
                      Meetings Conducted
                    </div>
                    <div style={{ fontSize: '14px', color: '#007bff' }}>
                      Avg: {(selectedSME.workingHours[timeFilter].hours / selectedSME.workingHours[timeFilter].meetings || 0).toFixed(1)}h per meeting
                    </div>
                  </div>

                  <div style={{
                    padding: '25px',
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    border: '1px solid #e3e6f0',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                  }}>
                    <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#ffc107', marginBottom: '10px' }}>
                      {selectedSME.workingHours[timeFilter].consultations}
                    </div>
                    <div style={{ color: '#6c757d', marginBottom: '10px' }}>
                      Consultations Given
                    </div>
                    <div style={{ fontSize: '14px', color: '#6c757d' }}>
                      {timeFilter === 'month' ? 'Monthly target: 40' : 'On track'}
                    </div>
                  </div>
                </div>

                {/* Hours Breakdown Chart */}
                <div style={{
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  border: '1px solid #e3e6f0',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  padding: '25px'
                }}>
                  <h4 style={{ margin: '0 0 20px 0', color: '#495057' }}>
                    📊 Hours Distribution - {timeFilter.charAt(0).toUpperCase() + timeFilter.slice(1)}
                  </h4>
                  
                  {timeFilter === 'week' && (
                    <div style={{ display: 'flex', alignItems: 'end', gap: '8px', height: '200px', padding: '0 10px' }}>
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day, index) => {
                        const hours = [5.5, 6.2, 7.1, 4.8, 4.4][index];
                        const height = (hours / 8) * 150;
                        const isToday = index === 2; // Wednesday
                        return (
                          <div key={day} style={{ 
                            display: 'flex', 
                            flexDirection: 'column', 
                            alignItems: 'center',
                            flex: 1
                          }}>
                            <div style={{
                              width: '100%',
                              maxWidth: '40px',
                              height: `${height}px`,
                              backgroundColor: isToday ? '#007bff' : '#e3f2fd',
                              borderRadius: '4px',
                              marginBottom: '8px',
                              position: 'relative',
                              display: 'flex',
                              alignItems: 'end',
                              justifyContent: 'center',
                              paddingBottom: '5px'
                            }}>
                              <span style={{
                                fontSize: '11px',
                                fontWeight: 'bold',
                                color: isToday ? 'white' : '#007bff'
                              }}>
                                {hours}h
                              </span>
                            </div>
                            <div style={{ 
                              fontSize: '12px', 
                              color: '#6c757d',
                              fontWeight: isToday ? 'bold' : 'normal'
                            }}>
                              {day}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {timeFilter === 'month' && (
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(4, 1fr)',
                      gap: '15px',
                      textAlign: 'center'
                    }}>
                      {['Week 1', 'Week 2', 'Week 3', 'Week 4'].map((week, index) => {
                        const weekHours = [35, 38, 42, 27][index];
                        return (
                          <div key={week} style={{
                            padding: '15px',
                            backgroundColor: index === 2 ? '#e3f2fd' : '#f8f9fa',
                            borderRadius: '8px',
                            border: index === 2 ? '2px solid #007bff' : '1px solid #e3e6f0'
                          }}>
                            <div style={{ 
                              fontSize: '24px', 
                              fontWeight: 'bold', 
                              color: index === 2 ? '#007bff' : '#495057',
                              marginBottom: '5px'
                            }}>
                              {weekHours}h
                            </div>
                            <div style={{ fontSize: '12px', color: '#6c757d' }}>{week}</div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {timeFilter === 'day' && (
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                      gap: '15px'
                    }}>
                      <div style={{
                        padding: '20px',
                        backgroundColor: '#f8f9fa',
                        borderRadius: '8px',
                        textAlign: 'center'
                      }}>
                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#495057', marginBottom: '5px' }}>
                          9:00 - 12:30
                        </div>
                        <div style={{ fontSize: '12px', color: '#6c757d' }}>Morning Session</div>
                        <div style={{ fontSize: '14px', color: '#007bff', marginTop: '5px' }}>3.5 hours</div>
                      </div>
                      <div style={{
                        padding: '20px',
                        backgroundColor: '#f8f9fa',
                        borderRadius: '8px',
                        textAlign: 'center'
                      }}>
                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#495057', marginBottom: '5px' }}>
                          14:00 - 17:00
                        </div>
                        <div style={{ fontSize: '12px', color: '#6c757d' }}>Afternoon Session</div>
                        <div style={{ fontSize: '14px', color: '#007bff', marginTop: '5px' }}>3.0 hours</div>
                      </div>
                    </div>
                  )}
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
          👨‍💼 SME Information
        </h1>
        <p style={{ color: '#6c757d', fontSize: '14px' }}>
          Subject Matter Expert profiles, portfolios, and performance analytics
        </p>
      </div>

      {/* Filters and Search */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        border: '1px solid #e3e6f0',
        padding: '20px',
        marginBottom: '20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
      }}>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Search SMEs by name or specialization..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              flex: 1,
              minWidth: '250px',
              padding: '10px 12px',
              border: '1px solid #ced4da',
              borderRadius: '6px',
              fontSize: '14px',
              outline: 'none'
            }}
          />

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{
              padding: '10px 12px',
              border: '1px solid #ced4da',
              borderRadius: '6px',
              fontSize: '14px',
              minWidth: '150px'
            }}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="busy">Busy</option>
            <option value="inactive">Inactive</option>
          </select>

          <button
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
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* SME Statistics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '20px' }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          border: '1px solid #e3e6f0',
          padding: '20px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
        }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#007bff', marginBottom: '5px' }}>
            {filteredSMEs.length}
          </div>
          <div style={{ color: '#6c757d', fontSize: '14px' }}>Total SMEs</div>
        </div>

        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          border: '1px solid #e3e6f0',
          padding: '20px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
        }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#28a745', marginBottom: '5px' }}>
            {filteredSMEs.filter(sme => sme.status === 'Active').length}
          </div>
          <div style={{ color: '#6c757d', fontSize: '14px' }}>Active SMEs</div>
        </div>

        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          border: '1px solid #e3e6f0',
          padding: '20px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
        }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ffc107', marginBottom: '5px' }}>
            {filteredSMEs.reduce((sum, sme) => sum + sme.scheduledMeets.length, 0)}
          </div>
          <div style={{ color: '#6c757d', fontSize: '14px' }}>Upcoming Meetings</div>
        </div>

        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          border: '1px solid #e3e6f0',
          padding: '20px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
        }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#dc3545', marginBottom: '5px' }}>
            {(filteredSMEs.reduce((sum, sme) => sum + sme.rating, 0) / filteredSMEs.length).toFixed(1)}
          </div>
          <div style={{ color: '#6c757d', fontSize: '14px' }}>Average Rating</div>
        </div>
      </div>

      {/* SME List */}
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
          <h3 style={{ margin: 0, color: '#495057' }}>
            Subject Matter Experts ({filteredSMEs.length})
          </h3>
        </div>

        <div style={{ padding: '20px' }}>
          {filteredSMEs.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#6c757d', padding: '40px' }}>
              No SMEs found matching your criteria.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {filteredSMEs.map((sme) => (
                <div key={sme.id} style={{
                  padding: '20px',
                  border: '1px solid #e3e6f0',
                  borderRadius: '8px',
                  transition: 'box-shadow 0.3s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)'}
                onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
                onClick={() => setSelectedSME(sme)}
                >
                  <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-start' }}>
                    <img 
                      src={sme.avatar} 
                      alt={sme.name}
                      style={{ width: '60px', height: '60px', borderRadius: '50%', flexShrink: 0 }}
                    />
                    
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                        <h4 style={{ margin: 0, color: '#495057', fontSize: '18px' }}>
                          {sme.name}
                        </h4>
                        <span style={getStatusBadge(sme.status)}>{sme.status}</span>
                        <div style={{ fontSize: '14px', color: '#6c757d' }}>
                          ⭐ {sme.rating}/5.0
                        </div>
                      </div>

                      <div style={{ fontSize: '14px', color: '#6c757d', marginBottom: '10px' }}>
                        📧 {sme.email}
                      </div>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
                        {sme.specializations.map((spec, index) => (
                          <span key={index} style={{
                            padding: '4px 8px',
                            backgroundColor: '#e7f3ff',
                            color: '#004085',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: '500'
                          }}>
                            {spec}
                          </span>
                        ))}
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px', fontSize: '13px', color: '#6c757d' }}>
                        <span>📅 {sme.scheduledMeets.length} upcoming meetings</span>
                        <span>💼 {sme.portfolio.projects.length} projects</span>
                        <span>🕒 {sme.workingHours.week.hours}h this week</span>
                        <span>📈 {sme.totalMeetings} total meetings</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSME(sme);
                        }}
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
                      
                      <button 
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: 'transparent',
                          color: '#28a745',
                          border: '1px solid #28a745',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        Schedule Meeting
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SMEInformation;