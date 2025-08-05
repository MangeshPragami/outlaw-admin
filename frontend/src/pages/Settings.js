import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { getAdminSettings } from '../services/api';

const Settings = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { token } = useContext(AuthContext);

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await getAdminSettings(token);
        setSettings(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [token]);

  return (
    <div style={{ padding: '20px', height: '100%' }}>
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '600', color: '#495057', marginBottom: '8px' }}>
          ⚙️ Settings
        </h1>
        <p style={{ color: '#6c757d', fontSize: '14px' }}>
          System configuration, preferences, and administrative controls
        </p>
      </div>
      
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        border: '1px solid #e3e6f0',
        minHeight: '500px',
        padding: '30px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          flexDirection: 'column',
          color: '#6c757d'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '20px', opacity: 0.5 }}>⚙️</div>
          <h3 style={{ marginBottom: '10px', color: '#495057' }}>System Settings</h3>
          {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}
          {loading ? (
            <div>Loading settings...</div>
          ) : (
            <div>
              <pre>{JSON.stringify(settings, null, 2)}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;