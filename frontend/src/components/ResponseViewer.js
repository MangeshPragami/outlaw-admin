// Create new file: src/components/ResponseViewer.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ResponseViewer = ({ responseUrl, onClose }) => {
  const [responseData, setResponseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchResponseData = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get(responseUrl);
        setResponseData(data);
      } catch (err) {
        setError('Failed to load response data');
        console.error('Error fetching response:', err);
      } finally {
        setLoading(false);
      }
    };

    if (responseUrl) {
      fetchResponseData();
    }
  }, [responseUrl]);

  const getAnswerDisplay = (response) => {
    switch (response.type) {
      case 'scale':
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ 
              backgroundColor: '#8A5CF6', 
              color: 'white', 
              padding: '4px 12px', 
              borderRadius: '20px',
              fontWeight: '600',
              fontSize: '14px'
            }}>
              {response.answer}/5
            </div>
            <div style={{ display: 'flex', gap: '4px' }}>
              {[1, 2, 3, 4, 5].map(num => (
                <div
                  key={num}
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    backgroundColor: num <= response.answer ? '#8A5CF6' : '#e0e0e0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '10px',
                    color: num <= response.answer ? 'white' : '#666',
                    fontWeight: '600'
                  }}
                >
                  {num}
                </div>
              ))}
            </div>
          </div>
        );
      
      case 'mcq':
        return (
          <div>
            <div style={{ 
              backgroundColor: '#28a745', 
              color: 'white', 
              padding: '6px 12px', 
              borderRadius: '6px',
              display: 'inline-block',
              marginBottom: '8px',
              fontWeight: '600'
            }}>
              ✓ {response.answer}
            </div>
            {response.options && (
              <div style={{ fontSize: '12px', color: '#666' }}>
                <strong>Available options:</strong> {response.options.join(', ')}
              </div>
            )}
          </div>
        );
      
      case 'yes_no':
        return (
          <div style={{ 
            backgroundColor: response.answer.toLowerCase() === 'yes' ? '#28a745' : '#dc3545', 
            color: 'white', 
            padding: '6px 16px', 
            borderRadius: '20px',
            display: 'inline-block',
            fontWeight: '600'
          }}>
            {response.answer.toLowerCase() === 'yes' ? '✓ Yes' : '✗ No'}
          </div>
        );
      
      case 'text':
        return (
          <div style={{ 
            backgroundColor: '#f8f9fa', 
            padding: '12px', 
            borderRadius: '6px',
            border: '1px solid #e9ecef',
            fontStyle: 'italic',
            color: '#495057'
          }}>
            "{response.answer}"
          </div>
        );
      
      default:
        return (
          <div style={{ 
            backgroundColor: '#e9ecef', 
            padding: '6px 12px', 
            borderRadius: '4px',
            color: '#495057'
          }}>
            {response.answer}
          </div>
        );
    }
  };

  const getQuestionIcon = (type) => {
    switch (type) {
      case 'scale': return '📊';
      case 'mcq': return '☑️';
      case 'yes_no': return '❓';
      case 'text': return '📝';
      default: return '❔';
    }
  };

  if (loading) {
    return (
      <div style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0, 
        backgroundColor: 'rgba(0,0,0,0.9)', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        zIndex: 1000,
        color: 'white'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '18px', marginBottom: '8px' }}>Loading response...</div>
          <div style={{ fontSize: '14px', color: '#8A5CF6' }}>Please wait</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0, 
        backgroundColor: 'rgba(0,0,0,0.9)', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        zIndex: 1000,
        color: 'white'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '18px', marginBottom: '16px', color: '#dc3545' }}>{error}</div>
          <button 
            onClick={onClose}
            style={{ 
              padding: '8px 16px', 
              backgroundColor: '#8A5CF6', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      right: 0, 
      bottom: 0, 
      backgroundColor: 'rgba(0,0,0,0.9)', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{ 
        backgroundColor: '#1e1e2e', 
        borderRadius: '12px', 
        width: '90%', 
        maxWidth: '800px',
        maxHeight: '90%',
        overflow: 'hidden',
        border: '2px solid #8A5CF6',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{ 
          backgroundColor: '#8A5CF6', 
          padding: '20px', 
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '24px' }}>Form Response</h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '14px', opacity: 0.9 }}>
              Respondent ID: {responseData?.respondent_id}
            </p>
          </div>
          <button 
            onClick={onClose}
            style={{ 
              backgroundColor: 'rgba(255,255,255,0.2)', 
              border: 'none', 
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              color: 'white',
              cursor: 'pointer',
              fontSize: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Close"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div style={{ 
          padding: '20px', 
          flex: 1, 
          overflowY: 'auto',
          backgroundColor: '#121212'
        }}>
          {responseData?.responses && responseData.responses.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {responseData.responses.map((response, index) => (
                <div 
                  key={index} 
                  style={{ 
                    backgroundColor: '#2c2c3e', 
                    padding: '20px', 
                    borderRadius: '8px',
                    border: '1px solid #444'
                  }}
                >
                  {/* Question */}
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'flex-start', 
                      gap: '8px',
                      marginBottom: '8px'
                    }}>
                      <span style={{ fontSize: '18px' }}>{getQuestionIcon(response.type)}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ 
                          color: '#e0e0e0', 
                          fontSize: '16px', 
                          fontWeight: '500',
                          lineHeight: '1.4'
                        }}>
                          {response.text}
                        </div>
                        <div style={{ 
                          color: '#8A5CF6', 
                          fontSize: '12px', 
                          fontWeight: '600',
                          textTransform: 'uppercase',
                          marginTop: '4px'
                        }}>
                          {response.type.replace('_', ' ')}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Answer */}
                  <div style={{ marginLeft: '26px' }}>
                    {getAnswerDisplay(response)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ 
              textAlign: 'center', 
              color: '#8A5CF6', 
              fontSize: '16px',
              padding: '40px'
            }}>
              No responses found
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ 
          backgroundColor: '#2c2c3e', 
          padding: '16px 20px',
          borderTop: '1px solid #444',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ color: '#8A5CF6', fontSize: '12px' }}>
            {responseData?.responses?.length || 0} responses • Request ID: {responseData?.request_id || 'N/A'}
          </div>
          <button 
            onClick={onClose}
            style={{ 
              padding: '8px 16px', 
              backgroundColor: '#8A5CF6', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResponseViewer;