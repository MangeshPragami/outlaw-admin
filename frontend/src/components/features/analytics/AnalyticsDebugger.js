import React, { useState, useEffect } from 'react';

const AnalyticsDebugger = () => {
  const [debugData, setDebugData] = useState({});
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const endpoints = [
    { name: 'Health Check', url: '/api/health' },
    { name: 'Test Tables', url: '/api/test/tables' },
    { name: 'Users Overview', url: '/api/analytics/users/overview?period=all' },
    { name: 'Users Growth', url: '/api/analytics/users/growth?period=30' },
    { name: 'Ideas Overview', url: '/api/analytics/ideas/overview?period=all' },
    { name: 'Ideas Trends', url: '/api/analytics/ideas/trends?period=30' },
    { name: 'Forms Overview', url: '/api/analytics/forms/overview?period=all' },
    { name: 'Bookings Overview', url: '/api/analytics/bookings/overview?period=all' },
    { name: 'Creators Overview', url: '/api/analytics/creators/overview?period=all' },
    { name: 'SME Overview', url: '/api/analytics/sme/overview?period=all' },
    { name: 'Engagement Funnel', url: '/api/analytics/engagement/funnel' },
    { name: 'Realtime', url: '/api/analytics/realtime' }
  ];

  const testAllEndpoints = async () => {
    setLoading(true);
    setDebugData({});
    setErrors({});

    for (const endpoint of endpoints) {
      try {
  console.log(`Testing: ${endpoint.url}`);
  const response = await fetch(endpoint.url);
  const data = await response.json();

  setDebugData(prev => ({
    ...prev,
    [endpoint.name]: {
      status: response.status,
      ok: response.ok,
      data: data
    }
  }));

  // If status is not OK (like 500), log it as an error
  if (!response.ok) {
    setErrors(prev => ({
      ...prev,
      [endpoint.name]: `HTTP ${response.status}: ${data?.message || 'Server error'}`
    }));
  }

} catch (error) {
  console.error(`Error testing ${endpoint.name}:`, error);
  setErrors(prev => ({
    ...prev,
    [endpoint.name]: error.message
  }));
}
    }
    setLoading(false);
  };

  const testDatabaseConnection = async () => {
    try {
      const response = await fetch('/api/analytics/health');
      const data = await response.json();
      console.log('Database Health:', data);
    } catch (error) {
      console.error('Database connection failed:', error);
    }
  };

  const checkTableData = async () => {
    try {
      const response = await fetch('/api/analytics/test/tables');
      const data = await response.json();
      console.log('Available Tables:', data);
    } catch (error) {
      console.error('Table check failed:', error);
    }
  };

  useEffect(() => {
    testAllEndpoints();
  }, []);

  const getStatusColor = (status) => {
    if (status >= 200 && status < 300) return '#10b981'; // green
    if (status >= 400 && status < 500) return '#f59e0b'; // yellow
    if (status >= 500) return '#ef4444'; // red
    return '#6b7280'; // gray
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ margin: '0 0 1rem 0', color: '#1f2937' }}>Analytics API Debugger</h1>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button 
            onClick={testAllEndpoints}
            disabled={loading}
            style={{
              padding: '0.75rem 1.5rem',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1
            }}
          >
            {loading ? 'Testing...' : 'Test All Endpoints'}
          </button>
          <button 
            onClick={testDatabaseConnection}
            style={{
              padding: '0.75rem 1.5rem',
              background: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            Test Database
          </button>
          <button 
            onClick={checkTableData}
            style={{
              padding: '0.75rem 1.5rem',
              background: '#f59e0b',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            Check Tables
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gap: '1rem' }}>
        {endpoints.map(endpoint => {
          const result = debugData[endpoint.name];
          const error = errors[endpoint.name];
          
          return (
            <div 
              key={endpoint.name}
              style={{
                background: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '1rem'
              }}
            >
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '0.5rem'
              }}>
                <h3 style={{ margin: 0, color: '#1f2937' }}>{endpoint.name}</h3>
                {result && (
                  <span 
                    style={{
                      padding: '0.25rem 0.75rem',
                      borderRadius: '20px',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      color: 'white',
                      background: getStatusColor(result.status)
                    }}
                  >
                    {result.status}
                  </span>
                )}
              </div>
              
              <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                {endpoint.url}
              </div>

              {error && (
                <div style={{
                  background: '#fee2e2',
                  color: '#991b1b',
                  padding: '0.75rem',
                  borderRadius: '6px',
                  marginBottom: '0.5rem'
                }}>
                  Error: {error}
                </div>
              )}

              {result && (
                <div>
                  <div style={{ 
                    display: 'flex', 
                    gap: '1rem', 
                    marginBottom: '0.5rem',
                    fontSize: '0.875rem'
                  }}>
                    <span style={{ color: result.ok ? '#10b981' : '#ef4444' }}>
                      Status: {result.ok ? 'Success' : 'Failed'}
                    </span>
                  </div>
                  
                  <details style={{ marginTop: '0.5rem' }}>
                    <summary style={{ cursor: 'pointer', fontWeight: '500' }}>
                      View Response Data
                    </summary>
                    <pre style={{
                      background: '#f3f4f6',
                      padding: '1rem',
                      borderRadius: '6px',
                      overflow: 'auto',
                      fontSize: '0.75rem',
                      marginTop: '0.5rem'
                    }}>
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </details>

                  {/* Data Analysis */}
                  <div style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>
                    <strong>Quick Analysis:</strong>
                    <ul style={{ margin: '0.5rem 0', paddingLeft: '1rem' }}>
                      {result.data && typeof result.data === 'object' ? (
                        <>
                          <li>Response Type: {Array.isArray(result.data) ? 'Array' : 'Object'}</li>
                          {Array.isArray(result.data) ? (
                            <li>Items Count: {result.data.length}</li>
                          ) : (
                            <li>Properties: {Object.keys(result.data).join(', ')}</li>
                          )}
                          {endpoint.name.includes('Overview') && result.data && (
                            <li>
                              Data Points: {JSON.stringify(result.data).length > 50 ? 'Has Data' : 'Mostly Empty'}
                            </li>
                          )}
                        </>
                      ) : (
                        <li>Invalid Response Format</li>
                      )}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div style={{
        marginTop: '2rem',
        background: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        padding: '1.5rem'
      }}>
        <h3 style={{ margin: '0 0 1rem 0', color: '#1f2937' }}>Debug Summary</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: '800', color: '#10b981' }}>
              {Object.values(debugData).filter(d => d.ok).length}
            </div>
            <div style={{ color: '#6b7280' }}>Successful</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: '800', color: '#ef4444' }}>
              {Object.keys(errors).length}
            </div>
            <div style={{ color: '#6b7280' }}>Errors</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: '800', color: '#f59e0b' }}>
              {Object.values(debugData).filter(d => d.ok && JSON.stringify(d.data).length < 100).length}
            </div>
            <div style={{ color: '#6b7280' }}>Empty/Low Data</div>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div style={{
        marginTop: '1rem',
        background: '#eff6ff',
        border: '1px solid #3b82f6',
        borderRadius: '8px',
        padding: '1.5rem'
      }}>
        <h4 style={{ margin: '0 0 1rem 0', color: '#1d4ed8' }}>Debugging Recommendations:</h4>
        <ol style={{ margin: 0, paddingLeft: '1.5rem', color: '#1e40af' }}>
          <li>Check if your analytics API server is running on the correct port</li>
          <li>Verify database connection and table existence</li>
          <li>Look for endpoints returning empty arrays or objects</li>
          <li>Check browser console for CORS or network errors</li>
          <li>Verify your database has actual data in the tables</li>
          <li>Test SQL queries directly in your database</li>
        </ol>
      </div>
    </div>
  );
};

export default AnalyticsDebugger;