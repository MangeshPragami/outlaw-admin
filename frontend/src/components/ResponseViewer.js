// src/components/ResponseViewer.js
import React, { useState, useEffect } from 'react';

const ResponseViewer = ({ responseUrl, onClose }) => {
  const [responseData, setResponseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchResponse = async () => {
      try {
        const response = await fetch(responseUrl);
        if (!response.ok) throw new Error('Failed to fetch response');
        const data = await response.json();
        setResponseData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchResponse();
  }, [responseUrl]);

  if (loading) {
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
          backgroundColor: 'white',
          padding: '40px',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '18px', marginBottom: '16px' }}>📋</div>
          <div>Loading response...</div>
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
        backgroundColor: 'rgba(0,0,0,0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '40px',
          borderRadius: '8px',
          textAlign: 'center',
          maxWidth: '400px'
        }}>
          <div style={{ fontSize: '18px', marginBottom: '16px', color: '#dc3545' }}>❌</div>
          <div style={{ marginBottom: '16px' }}>Error loading response</div>
          <div style={{ fontSize: '14px', color: '#6c757d', marginBottom: '20px' }}>{error}</div>
          <button
            onClick={onClose}
            style={{
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
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

  const formatValue = (value) => {
    if (value === null || value === undefined) return 'No response';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (Array.isArray(value)) return value.join(', ');
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  };

  const getQuestionIcon = (key) => {
    const lowerKey = key.toLowerCase();
    if (lowerKey.includes('email')) return '📧';
    if (lowerKey.includes('phone')) return '📞';
    if (lowerKey.includes('name')) return '👤';
    if (lowerKey.includes('age')) return '🎂';
    if (lowerKey.includes('rating') || lowerKey.includes('scale')) return '⭐';
    if (lowerKey.includes('date')) return '📅';
    if (lowerKey.includes('choice') || lowerKey.includes('select')) return '☑️';
    return '💬';
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.9)',
      zIndex: 1000,
      overflow: 'auto'
    }}>
      <div style={{
        backgroundColor: 'white',
        margin: '20px',
        borderRadius: '8px',
        maxWidth: '800px',
        marginLeft: 'auto',
        marginRight: 'auto'
      }}>
        {/* Header */}
        <div style={{
          backgroundColor: '#1e1e2e',
          color: 'white',
          padding: '20px',
          borderRadius: '8px 8px 0 0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h2 style={{ margin: 0, color: '#8A5CF6' }}>📋 Survey Response</h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#ccc' }}>
              Detailed response data
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            ✕ Close
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '30px' }}>
          {/* Response Info */}
          <div style={{
            backgroundColor: '#f8f9fa',
            padding: '20px',
            borderRadius: '8px',
            marginBottom: '24px'
          }}>
            <h3 style={{ margin: '0 0 16px 0', color: '#495057' }}>👤 Respondent Information</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <strong>Name:</strong> {responseData?.responder_name || 'Anonymous'}
              </div>
              <div>
                <strong>Email:</strong> {responseData?.responder_email || 'Not provided'}
              </div>
              <div>
                <strong>Type:</strong> {responseData?.responder_type || 'Unknown'}
              </div>
              <div>
                <strong>Submitted:</strong> {responseData?.created_at ? new Date(responseData.created_at).toLocaleString() : 'Unknown'}
              </div>
            </div>
          </div>

          {/* Response Data */}
          <div>
            <h3 style={{ margin: '0 0 20px 0', color: '#495057' }}>📝 Response Details</h3>
            
            {responseData?.response_data ? (
              <div style={{ display: 'grid', gap: '16px' }}>
                {Object.entries(responseData.response_data).map(([key, value]) => (
                  <div key={key} style={{
                    backgroundColor: 'white',
                    border: '1px solid #e9ecef',
                    borderRadius: '8px',
                    padding: '20px'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '12px'
                    }}>
                      <span style={{ fontSize: '20px' }}>{getQuestionIcon(key)}</span>
                      <h4 style={{
                        margin: 0,
                        fontSize: '16px',
                        color: '#495057',
                        textTransform: 'capitalize'
                      }}>
                        {key.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim()}
                      </h4>
                    </div>
                    
                    <div style={{
                      backgroundColor: '#f8f9fa',
                      padding: '12px 16px',
                      borderRadius: '6px',
                      border: '1px solid #e9ecef',
                      fontSize: '14px',
                      lineHeight: '1.5',
                      color: '#212529',
                      whiteSpace: 'pre-wrap'
                    }}>
                      {formatValue(value)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '40px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                color: '#6c757d'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📄</div>
                <div>No response data available</div>
              </div>
            )}
          </div>

          {/* Raw Data Section (Collapsible) */}
          <details style={{ marginTop: '24px' }}>
            <summary style={{
              cursor: 'pointer',
              padding: '12px',
              backgroundColor: '#e9ecef',
              borderRadius: '4px',
              fontWeight: '600'
            }}>
              🔍 View Raw JSON Data
            </summary>
            <pre style={{
              backgroundColor: '#f8f9fa',
              padding: '16px',
              borderRadius: '4px',
              overflow: 'auto',
              fontSize: '12px',
              color: '#495057',
              marginTop: '8px',
              border: '1px solid #e9ecef'
            }}>
              {JSON.stringify(responseData, null, 2)}
            </pre>
          </details>
        </div>
      </div>
    </div>
  );
};

export default ResponseViewer;