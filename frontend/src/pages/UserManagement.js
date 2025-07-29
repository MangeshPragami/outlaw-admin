import React, { useState, useEffect, useCallback, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { getUsersOverview, getAllUsers, setUserAdminVerified } from '../services/api';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all', 'verified', 'unverified'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [error, setError] = useState('');
  const { token } = useContext(AuthContext);

  // Load users from API
  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // You can use getAllUsers(token) for full list, or getUsersOverview(token) for summary
      const data = await getAllUsers(token);
      setUsers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Load users on component mount
  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Debounced search effect
  useEffect(() => {
    if (!searchTerm) return; // Don't reload on initial empty search
    
    const timeoutId = setTimeout(() => {
      loadUsers();
    }, 300); // Debounce search

    return () => clearTimeout(timeoutId);
  }, [searchTerm, loadUsers]);

  const handleApproveUser = async (userId) => {
    try {
      await setUserAdminVerified(token, userId, true);
      setUsers(users.map(user => user.id === userId ? { ...user, verified_by_admin: true } : user));
      alert('User approved successfully!');
    } catch (error) {
      setError(error.message);
      alert('Failed to approve user');
    }
  };

  const handleBulkApprove = async () => {
    try {
      await Promise.all(selectedUsers.map(id => setUserAdminVerified(token, id, true)));
      setUsers(users.map(user => selectedUsers.includes(user.id) ? { ...user, verified_by_admin: true } : user));
      setSelectedUsers([]);
      alert(`${selectedUsers.length} users approved successfully!`);
    } catch (error) {
      setError(error.message);
      alert('Failed to approve users');
    }
  };

  const handleRevokeApproval = async (userId) => {
    try {
      await setUserAdminVerified(token, userId, false);
      setUsers(users.map(user => user.id === userId ? { ...user, verified_by_admin: false } : user));
      alert('User approval revoked!');
    } catch (error) {
      setError(error.message);
      alert('Failed to revoke approval');
    }
  };

  const filteredUsers = users.filter(user => {
    // Filter by verification status
    if (filter === 'verified' && !user.isApproved) return false;
    if (filter === 'unverified' && user.isApproved) return false;
    
    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        user.email.toLowerCase().includes(searchLower) ||
        (user.name && user.name.toLowerCase().includes(searchLower)) ||
        user.persona_type.toLowerCase().includes(searchLower)
      );
    }
    
    return true;
  });

  const getPersonaTypeBadge = (personaType) => {
    const styles = {
      founder: { backgroundColor: '#e7f3ff', color: '#004085', border: '1px solid #b8daff' },
      sme: { backgroundColor: '#d4edda', color: '#155724', border: '1px solid #c3e6cb' },
      respondent: { backgroundColor: '#fff3cd', color: '#856404', border: '1px solid #ffeaa7' },
      not_selected: { backgroundColor: '#f8d7da', color: '#721c24', border: '1px solid #f5c6cb' }
    };

    return {
      padding: '4px 8px',
      borderRadius: '12px',
      fontSize: '11px',
      fontWeight: '600',
      textTransform: 'uppercase',
      ...styles[personaType] || styles.not_selected
    };
  };

  const getApprovalBadge = (isApproved) => {
    if (isApproved) {
      return {
        backgroundColor: '#d4edda',
        color: '#155724',
        border: '1px solid #c3e6cb',
        padding: '4px 8px',
        borderRadius: '12px',
        fontSize: '11px',
        fontWeight: '600'
      };
    } else {
      return {
        backgroundColor: '#f8d7da',
        color: '#721c24',
        border: '1px solid #f5c6cb',
        padding: '4px 8px',
        borderRadius: '12px',
        fontSize: '11px',
        fontWeight: '600'
      };
    }
  };

  const handleSelectUser = (userId) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    } else {
      setSelectedUsers([...selectedUsers, userId]);
    }
  };

  const selectAllUsers = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(user => user.id));
    }
  };

  return (
    <div style={{ padding: '20px', height: '100%' }}>
      {error && (
        <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>
      )}
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '600', color: '#495057', marginBottom: '8px' }}>
          👥 User Management
        </h1>
        <p style={{ color: '#6c757d', fontSize: '14px' }}>
          Manage user accounts, approvals, and access controls
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
          {/* Search */}
          <input
            type="text"
            placeholder="Search by email, name, or persona type..."
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

          {/* Filter Dropdown */}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{
              padding: '10px 12px',
              border: '1px solid #ced4da',
              borderRadius: '6px',
              fontSize: '14px',
              minWidth: '150px'
            }}
          >
            <option value="all">All Users</option>
            <option value="verified">✅ Approved Users</option>
            <option value="unverified">❌ Pending Approval</option>
          </select>

          {/* Bulk Actions */}
          {selectedUsers.length > 0 && (
            <button
              onClick={handleBulkApprove}
              style={{
                padding: '10px 16px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              Approve Selected ({selectedUsers.length})
            </button>
          )}

          <button
            onClick={loadUsers}
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

      {/* Users Table */}
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
          borderRadius: '8px 8px 0 0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h3 style={{ margin: 0, color: '#495057' }}>
            Users ({filteredUsers.length})
          </h3>
          <div style={{ display: 'flex', gap: '10px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '14px' }}>
              <input
                type="checkbox"
                checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                onChange={selectAllUsers}
              />
              Select All
            </label>
          </div>
        </div>

        <div style={{ padding: '20px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <div style={{ fontSize: '24px', marginBottom: '10px' }}>⏳</div>
              <div>Loading users...</div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#6c757d', padding: '40px' }}>
              No users found matching your criteria.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {filteredUsers.map((user) => (
                <div key={user.id} style={{
                  padding: '20px',
                  border: '1px solid #e3e6f0',
                  borderRadius: '8px',
                  transition: 'box-shadow 0.3s ease'
                }}
                onMouseEnter={(e) => e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)'}
                onMouseLeave={(e) => e.target.style.boxShadow = 'none'}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', gap: '15px', flex: 1 }}>
                      {/* Selection Checkbox */}
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={() => handleSelectUser(user.id)}
                        style={{ marginTop: '5px' }}
                      />

                      {/* User Info */}
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                          <h4 style={{ margin: 0, color: '#495057', fontSize: '16px' }}>
                            {user.name || 'No Name Provided'}
                          </h4>
                          <span style={getPersonaTypeBadge(user.persona_type)}>
                            {user.persona_type.replace('_', ' ')}
                          </span>
                          <span style={getApprovalBadge(user.isApproved)}>
                            {user.isApproved ? '✅ APPROVED' : '❌ PENDING'}
                          </span>
                        </div>

                        <div style={{ fontSize: '14px', color: '#6c757d', marginBottom: '10px' }}>
                          📧 {user.email}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', fontSize: '13px', color: '#6c757d' }}>
                          <span>🏢 {user.profile_title || 'No title'}</span>
                          <span>🌍 {user.country || 'Not specified'}</span>
                          <span>💼 {user.industry || 'Not specified'}</span>
                          <span>🎂 {user.age ? `${user.age} years` : 'Age not provided'}</span>
                        </div>

                        {user.linkedin && (
                          <div style={{ marginTop: '8px', fontSize: '13px' }}>
                            🔗 <a href={user.linkedin} target="_blank" rel="noopener noreferrer" style={{ color: '#007bff' }}>
                              LinkedIn Profile
                            </a>
                          </div>
                        )}

                        <div style={{ marginTop: '8px', fontSize: '12px', color: '#6c757d' }}>
                          📅 Joined: {new Date(user.created_at).toLocaleDateString()}
                          {user.email_verified_at && (
                            <span style={{ marginLeft: '15px' }}>
                              ✅ Email verified: {new Date(user.email_verified_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                      {user.isApproved ? (
                        <button
                          onClick={() => handleRevokeApproval(user.id)}
                          style={{
                            padding: '8px 12px',
                            backgroundColor: '#dc3545',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          Revoke Approval
                        </button>
                      ) : (
                        <button
                          onClick={() => handleApproveUser(user.id)}
                          style={{
                            padding: '8px 12px',
                            backgroundColor: '#28a745',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          ✅ Approve User
                        </button>
                      )}
                      
                      <button style={{
                        padding: '8px 12px',
                        backgroundColor: 'transparent',
                        color: '#007bff',
                        border: '1px solid #007bff',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}>
                        View Profile
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

export default UserManagement;