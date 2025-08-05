// Create new file: src/components/SurveyFormViewer.js
import React, { useState, useEffect, useCallback } from 'react';

const SurveyFormViewer = ({ formUrl, onClose }) => {
  const [formData, setFormData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchFormData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      console.log('🔍 Fetching form data from:', formUrl);
      
      const response = await fetch(formUrl);
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      
      const data = await response.json();
      console.log('📋 Fetched form data:', data);
      
      // Set the actual fetched data instead of just metadata
      setFormData(data);
    } catch (err) {
      console.error('❌ Error fetching form data:', err);
      setError('Failed to load form data: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [formUrl]);

  useEffect(() => {
    fetchFormData();
  }, [fetchFormData]);

  const getQuestionTypeIcon = (type) => {
    switch (type) {
      case 'mcq': return '📋';
      case 'text': return '📝';
      case 'yes_no': return '✅';
      case 'scale': return '📊';
      case 'email': return '📧';
      case 'phone': return '📞';
      case 'date': return '📅';
      default: return '❓';
    }
  };

  const renderQuestion = (question, index) => {
    return (
      <div key={index} style={{ 
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        border: '1px solid #e9ecef',
        marginBottom: '16px'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px',
          marginBottom: '12px'
        }}>
          <span style={{ fontSize: '20px' }}>{getQuestionTypeIcon(question.type)}</span>
          <span style={{ 
            fontSize: '12px', 
            fontWeight: '600',
            color: '#6c757d',
            textTransform: 'uppercase',
            backgroundColor: '#f8f9fa',
            padding: '2px 8px',
            borderRadius: '12px'
          }}>
            {question.type || 'unknown'}
          </span>
        </div>

        <h3 style={{ 
          margin: '0 0 16px 0', 
          fontSize: '18px', 
          color: '#495057',
          lineHeight: '1.4'
        }}>
          {question.text || question.question || 'No question text'}
        </h3>

        {/* Render different question types */}
        {(question.type === 'mcq' || question.options) && question.options && (
          <div style={{ marginTop: '12px' }}>
            <div style={{ 
              fontSize: '14px', 
              fontWeight: '600', 
              color: '#6c757d',
              marginBottom: '8px'
            }}>
              Options:
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {question.options.map((option, optIndex) => (
                <div key={optIndex} style={{ 
                  padding: '8px 12px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '6px',
                  border: '1px solid #e9ecef',
                  fontSize: '14px'
                }}>
                  <span style={{ 
                    backgroundColor: '#007bff',
                    color: 'white',
                    borderRadius: '50%',
                    width: '20px',
                    height: '20px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    marginRight: '8px'
                  }}>
                    {String.fromCharCode(65 + optIndex)}
                  </span>
                  {option}
                </div>
              ))}
            </div>
          </div>
        )}

        {question.type === 'scale' && (
          <div style={{ marginTop: '12px' }}>
            <div style={{ 
              fontSize: '14px', 
              fontWeight: '600', 
              color: '#6c757d',
              marginBottom: '8px'
            }}>
              Scale Response (1-10):
            </div>
            <div style={{ 
              display: 'flex', 
              gap: '4px',
              alignItems: 'center'
            }}>
              {[1,2,3,4,5,6,7,8,9,10].map(num => (
                <div key={num} style={{
                  width: '32px',
                  height: '32px',
                  border: '1px solid #ced4da',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  color: '#6c757d'
                }}>
                  {num}
                </div>
              ))}
            </div>
          </div>
        )}

        {question.type === 'yes_no' && (
          <div style={{ marginTop: '12px' }}>
            <div style={{ 
              fontSize: '14px', 
              fontWeight: '600', 
              color: '#6c757d',
              marginBottom: '8px'
            }}>
              Response Type:
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{
                padding: '8px 16px',
                backgroundColor: '#d4edda',
                color: '#155724',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '600'
              }}>
                ✅ Yes
              </div>
              <div style={{
                padding: '8px 16px',
                backgroundColor: '#f8d7da',
                color: '#721c24',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '600'
              }}>
                ❌ No
              </div>
            </div>
          </div>
        )}

        {question.type === 'text' && (
          <div style={{ marginTop: '12px' }}>
            <div style={{
              padding: '12px',
              backgroundColor: '#f8f9fa',
              border: '1px solid #e9ecef',
              borderRadius: '6px',
              fontSize: '14px',
              color: '#6c757d',
              fontStyle: 'italic'
            }}>
              📝 Open text response expected
            </div>
          </div>
        )}

        {/* Show purpose if available */}
        {question.purpose && (
          <div style={{ marginTop: '12px' }}>
            <div style={{
              padding: '8px 12px',
              backgroundColor: '#e7f3ff',
              border: '1px solid #b8d4fd',
              borderRadius: '6px',
              fontSize: '12px',
              color: '#004085'
            }}>
              <strong>Purpose:</strong> {question.purpose}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <button 
            onClick={onClose}
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
        </div>
        
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px'
        }}>
          <div style={{ fontSize: '16px', marginBottom: '8px' }}>📋 Loading form...</div>
          <div style={{ fontSize: '14px', color: '#6c757d' }}>
            Fetching form structure and questions
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <button 
            onClick={onClose}
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
        </div>
        
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          backgroundColor: '#f8d7da',
          borderRadius: '8px'
        }}>
          <div style={{ fontSize: '16px', marginBottom: '16px', color: '#721c24' }}>
            ❌ Error Loading Form
          </div>
          <div style={{ fontSize: '14px', color: '#721c24' }}>
            {error}
          </div>
          <button
            onClick={fetchFormData}
            style={{
              marginTop: '16px',
              padding: '8px 16px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            🔄 Retry
          </button>
        </div>
      </div>
    );
  }

  // Get questions from various possible locations in the data
  const questions = formData?.questions || formData?.data?.questions || [];
  const title = formData?.title || formData?.data?.title || 'Form Preview';
  const description = formData?.description || formData?.data?.description;

  return (
    <div style={{ padding: '20px' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <div>
          <button 
            onClick={onClose}
            style={{ 
              padding: '8px 16px', 
              backgroundColor: '#6c757d', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              cursor: 'pointer',
              marginBottom: '12px'
            }}
          >
            ← Back to Forms
          </button>
          <h2 style={{ margin: '0 0 4px 0', fontSize: '28px' }}>📋 {title}</h2>
          <p style={{ margin: 0, color: '#6c757d', fontSize: '16px' }}>
            {questions.length || 0} questions • Form structure and content
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '8px' }}>
          <a
            href={formUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: '8px 16px',
              backgroundColor: '#007bff',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          >
            🔗 View Raw Data
          </a>
          <button
            onClick={() => {
              navigator.clipboard.writeText(JSON.stringify(formData, null, 2));
              alert('Form data copied to clipboard!');
            }}
            style={{
              padding: '8px 16px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            📋 Copy JSON
          </button>
        </div>
      </div>

      {/* Form Content */}
      <div>
        {questions && questions.length > 0 ? (
          <div>
            {/* Description */}
            {description && (
              <div style={{
                backgroundColor: '#e7f3ff',
                padding: '20px',
                borderRadius: '8px',
                marginBottom: '24px'
              }}>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', color: '#004085' }}>
                  📝 Description
                </h3>
                <p style={{ margin: 0, color: '#004085' }}>{description}</p>
              </div>
            )}

            {/* Form Overview */}
            <div style={{
              backgroundColor: '#f8f9fa',
              padding: '20px',
              borderRadius: '8px',
              marginBottom: '24px'
            }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '20px', color: '#495057' }}>
                📊 Form Overview
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '32px', fontWeight: '600', color: '#007bff' }}>
                    {questions.length}
                  </div>
                  <div style={{ fontSize: '14px', color: '#6c757d' }}>Total Questions</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '32px', fontWeight: '600', color: '#28a745' }}>
                    {questions.filter(q => q.type === 'mcq' || q.options).length}
                  </div>
                  <div style={{ fontSize: '14px', color: '#6c757d' }}>Multiple Choice</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '32px', fontWeight: '600', color: '#ffc107' }}>
                    {questions.filter(q => q.type === 'text').length}
                  </div>
                  <div style={{ fontSize: '14px', color: '#6c757d' }}>Text Questions</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '32px', fontWeight: '600', color: '#dc3545' }}>
                    {questions.filter(q => q.type === 'scale').length}
                  </div>
                  <div style={{ fontSize: '14px', color: '#6c757d' }}>Scale Questions</div>
                </div>
              </div>
            </div>

            {/* Questions */}
            <div>
              <h3 style={{ margin: '0 0 20px 0', fontSize: '20px', color: '#495057' }}>
                📝 Form Questions
              </h3>
              {questions.map((question, index) => renderQuestion(question, index))}
            </div>
          </div>
        ) : (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px'
          }}>
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>📋</div>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '24px' }}>No Questions Found</h3>
            <p style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#6c757d' }}>
              This form doesn't contain any readable question data.
            </p>
            
            {/* Debug section */}
            <details style={{ marginTop: '20px' }}>
              <summary style={{ cursor: 'pointer', color: '#007bff' }}>🔍 Debug: View Raw Data</summary>
              <div style={{
                marginTop: '16px',
                padding: '16px',
                backgroundColor: '#2a2a2a',
                borderRadius: '8px',
                textAlign: 'left'
              }}>
                <pre style={{
                  color: '#ffffff',
                  fontSize: '12px',
                  lineHeight: '1.4',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  maxHeight: '300px',
                  overflow: 'auto'
                }}>
                  {JSON.stringify(formData, null, 2)}
                </pre>
              </div>
            </details>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div style={{
        marginTop: '40px',
        padding: '16px 20px',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        fontSize: '12px',
        color: '#6c757d',
        textAlign: 'center'
      }}>
        Form data loaded from: {formUrl}
      </div>
    </div>
  );
};

export default SurveyFormViewer;