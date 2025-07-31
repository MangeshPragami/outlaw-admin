import React, { useState, useEffect, useCallback, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { getUsersOverview, getAllUsers, setUserAdminVerified, createUser, updateUser, deleteUser } from '../services/api';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all', 'verified', 'unverified'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [error, setError] = useState('');
  const { token } = useContext(AuthContext);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [formData, setFormData] = useState({
    email: '', password: '', temp_id: '', auth_type: '', persona_type: '',
    created_at: '', updated_at: '', deleted_at: '', email_verified_at: '', verified_by_admin: false
  });

  // Load users from API - Remove the search dependency to avoid multiple calls
  const loadUsers = useCallback(async () => {
    if (!token) return; // Don't call API if no token
    
    setLoading(true);
    setError('');
    try {
      const data = await getAllUsers(token);
      // Ensure verified_by_admin is always boolean
      setUsers(data.map(user => ({ ...user, verified_by_admin: !!user.verified_by_admin })));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]); // Remove searchTerm from dependencies

  // Load users on component mount and when token changes
  useEffect(() => {
    if (token) {
      loadUsers();
    }
  }, [token, loadUsers]);

  // Remove the search effect that was causing multiple API calls
  // Search will now be handled client-side only

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

  // Add User
  const handleAddUser = async () => {
    try {
      await createUser(token, formData);
      setShowAddModal(false);
      setFormData({ email: '', password: '', temp_id: '', auth_type: '', persona_type: '', created_at: '', updated_at: '', deleted_at: '', email_verified_at: '', verified_by_admin: false });
      loadUsers();
      alert('User added successfully!');
    } catch (error) {
      setError(error.message);
      alert('Failed to add user');
    }
  };

  // Edit User
  const handleEditUser = async () => {
    try {
      await updateUser(token, editUser.id, formData);
      setShowEditModal(false);
      setEditUser(null);
      setFormData({ email: '', password: '', temp_id: '', auth_type: '', persona_type: '', created_at: '', updated_at: '', deleted_at: '', email_verified_at: '', verified_by_admin: false });
      loadUsers();
      alert('User updated successfully!');
    } catch (error) {
      setError(error.message);
      alert('Failed to update user');
    }
  };

  // Delete User
  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await deleteUser(token, userId);
      loadUsers();
      alert('User deleted successfully!');
    } catch (error) {
      setError(error.message);
      alert('Failed to delete user');
    }
  };

  // Client-side filtering - no API calls needed
  const filteredUsers = users.filter(user => {
    // Filter by verification status
    if (filter === 'verified' && !user.verified_by_admin) return false;
    if (filter === 'unverified' && user.verified_by_admin) return false;
    
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

  // Show loading if no token yet
  if (!token) {
    return <div style={{ padding: '20px' }}>Loading...</div>;
  }

  return (
    <div style={{ padding: '20px', height: '100%' }}>
      {/* Add User Button */}
      <button
        onClick={() => setShowAddModal(true)}
        style={{ marginBottom: '20px', padding: '10px 16px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}
      >
        ➕ Add User
      </button>

      {/* Add User Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: '30px', borderRadius: '8px', minWidth: '350px' }}>
            <h2>Add User</h2>
            {/* Simple form for user fields */}
            <input type="email" placeholder="Email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} style={{ width: '100%', marginBottom: '10px' }} />
            <input type="text" placeholder="Password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} style={{ width: '100%', marginBottom: '10px' }} />
            <input type="text" placeholder="Temp ID" value={formData.temp_id} onChange={e => setFormData({ ...formData, temp_id: e.target.value })} style={{ width: '100%', marginBottom: '10px' }} />
            <input type="text" placeholder="Auth Type" value={formData.auth_type} onChange={e => setFormData({ ...formData, auth_type: e.target.value })} style={{ width: '100%', marginBottom: '10px' }} />
            <input type="text" placeholder="Persona Type" value={formData.persona_type} onChange={e => setFormData({ ...formData, persona_type: e.target.value })} style={{ width: '100%', marginBottom: '10px' }} />
            <button onClick={handleAddUser} style={{ background: '#28a745', color: 'white', padding: '8px 16px', border: 'none', borderRadius: '4px', marginRight: '10px' }}>Add</button>
            <button onClick={() => setShowAddModal(false)} style={{ background: '#dc3545', color: 'white', padding: '8px 16px', border: 'none', borderRadius: '4px' }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: '30px', borderRadius: '8px', minWidth: '350px' }}>
            <h2>Edit User</h2>
            <input type="email" placeholder="Email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} style={{ width: '100%', marginBottom: '10px' }} />
            <input type="text" placeholder="Password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} style={{ width: '100%', marginBottom: '10px' }} />
            <input type="text" placeholder="Temp ID" value={formData.temp_id} onChange={e => setFormData({ ...formData, temp_id: e.target.value })} style={{ width: '100%', marginBottom: '10px' }} />
            <input type="text" placeholder="Auth Type" value={formData.auth_type} onChange={e => setFormData({ ...formData, auth_type: e.target.value })} style={{ width: '100%', marginBottom: '10px' }} />
            <input type="text" placeholder="Persona Type" value={formData.persona_type} onChange={e => setFormData({ ...formData, persona_type: e.target.value })} style={{ width: '100%', marginBottom: '10px' }} />
            <button onClick={handleEditUser} style={{ background: '#007bff', color: 'white', padding: '8px 16px', border: 'none', borderRadius: '4px', marginRight: '10px' }}>Save</button>
            <button onClick={() => setShowEditModal(false)} style={{ background: '#dc3545', color: 'white', padding: '8px 16px', border: 'none', borderRadius: '4px' }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Error Message */}
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
            <option value="unverified">⏳ Pending Approval</option>
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
            disabled={loading}
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
            🔄 {loading ? 'Loading...' : 'Refresh'}
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
                <div key={user.id} style={{ padding: '20px', border: '1px solid #e3e6f0', borderRadius: '8px', transition: 'box-shadow 0.3s ease' }}>
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
                          <span style={getApprovalBadge(user.verified_by_admin)}>
                            {user.verified_by_admin ? '✅ APPROVED' : '⏳ PENDING'}
                          </span>
                        </div>

                        <div style={{ fontSize: '14px', color: '#6c757d', marginBottom: '10px' }}>
                          📧 {user.email}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', fontSize: '13px', color: '#6c757d' }}>
                          <span>{user.profile_title || 'No title'}</span>
                          <span>🌍 {user.country || 'Not specified'}</span>
                          <span>🏢 {user.industry || 'Not specified'}</span>
                          <span>👤 {user.age ? `${user.age} years` : 'Age not provided'}</span>
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
                      {user.verified_by_admin ? (
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
                      
                      <button
                        onClick={() => {
                          setEditUser(user);
                          setFormData({
                            email: user.email,
                            password: user.password,
                            temp_id: user.temp_id,
                            auth_type: user.auth_type,
                            persona_type: user.persona_type,
                            created_at: user.created_at,
                            updated_at: user.updated_at,
                            deleted_at: user.deleted_at,
                            email_verified_at: user.email_verified_at,
                            verified_by_admin: user.verified_by_admin
                          });
                          setShowEditModal(true);
                        }}
                        style={{ padding: '8px 12px', backgroundColor: '#ffc107', color: '#212529', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        style={{ padding: '8px 12px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                      >
                        🗑️ Delete
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