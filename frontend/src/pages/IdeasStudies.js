import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { getIdeasOverview } from '../services/api';

const IdeasStudies = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStage, setSelectedStage] = useState('all');
  const [selectedIdea, setSelectedIdea] = useState(null);
  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { token } = useContext(AuthContext);

  useEffect(() => {
    const fetchIdeas = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await getIdeasOverview(token);
        setIdeas(data); // Adjust if API returns { ideas: [...] }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchIdeas();
  }, [token]);

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
      case 'Pending':
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

  if (selectedIdea) {
    // You can reuse the previous code’s detailed view component here
    return (
      <div style={{ padding: '20px' }}>
        <h2>{selectedIdea.name}</h2>
        <p>{selectedIdea.description}</p>
        <p><strong>Target Audience:</strong> {selectedIdea.targeted_audience}</p>
        <p><strong>Stage:</strong> {selectedIdea.stage}</p>
        <p><strong>Created At:</strong> {formatDate(selectedIdea.created_at)}</p>
        <p><strong>Updated At:</strong> {formatDate(selectedIdea.updated_at)}</p>
        <button onClick={() => setSelectedIdea(null)}>← Back</button>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2>Ideas Overview</h2>
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <input
          type="text"
          placeholder="Search ideas..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ padding: '8px', flex: 1, border: '1px solid #ced4da', borderRadius: '4px' }}
        />
        <select
          value={selectedStage}
          onChange={(e) => setSelectedStage(e.target.value)}
          style={{ padding: '8px', border: '1px solid #ced4da', borderRadius: '4px' }}
        >
          <option value="all">All Stages</option>
          <option value="Starting">Starting</option>
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
        </select>
      </div>

      {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}
      {loading ? (
        <div>Loading ideas...</div>
      ) : (
        <div>
          {ideas.length === 0 ? (
            <div>No ideas found.</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
              {filteredIdeas.map(idea => (
                <div
                  key={idea.id}
                  onClick={() => setSelectedIdea(idea)}
                  style={{
                    border: '1px solid #e3e6f0',
                    borderRadius: '8px',
                    backgroundColor: 'white',
                    padding: '16px',
                    cursor: 'pointer',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                  }}
                >
                  <h3 style={{ margin: '0 0 10px 0', fontSize: '18px' }}>{idea.name}</h3>
                  <p style={{ fontSize: '14px', color: '#6c757d' }}>{idea.description.substring(0, 100)}...</p>
                  <div style={{ marginTop: '10px' }}>
                    <span style={getStatusBadge(idea.stage)}>{idea.stage}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default IdeasStudies;
