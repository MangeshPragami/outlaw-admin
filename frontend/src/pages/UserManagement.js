import React, { useState, useEffect, useCallback, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { 
  getUsersOverview, 
  getAllUsers, 
  setUserAdminVerified, 
  createUser, 
  updateUser, 
  deleteUser, 
  getUserDetails 
} from '../services/api';
import './UserManagement.css';

const UserManagement = () => {
  // State management
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [error, setError] = useState('');
  const { token } = useContext(AuthContext);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showUserDetailsModal, setShowUserDetailsModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [selectedUserDetails, setSelectedUserDetails] = useState(null);
  const [userDetailsLoading, setUserDetailsLoading] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    temp_id: '',
    auth_type: '',
    persona_type: '',
    created_at: '',
    updated_at: '',
    deleted_at: '',
    email_verified_at: '',
    verified_by_admin: false
  });

  // Load users from API
  const loadUsers = useCallback(async () => {
    if (!token) return;
    
    setLoading(true);
    setError('');
    try {
      const data = await getAllUsers(token);
      setUsers(data.map(user => ({ 
        ...user, 
        verified_by_admin: !!user.verified_by_admin 
      })));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Load user details
  const loadUserDetails = async (userId) => {
    setUserDetailsLoading(true);
    try {
      const details = await getUserDetails(token, userId);
      setSelectedUserDetails(details);
      setShowUserDetailsModal(true);
    } catch (err) {
      setError(err.message);
      alert('Failed to load user details');
    } finally {
      setUserDetailsLoading(false);
    }
  };

  useEffect(() => {
    if (token) loadUsers();
  }, [token, loadUsers]);

  // Reset form data
  const resetFormData = () => {
    setFormData({
      email: '',
      password: '',
      temp_id: '',
      auth_type: '',
      persona_type: '',
      created_at: '',
      updated_at: '',
      deleted_at: '',
      email_verified_at: '',
      verified_by_admin: false
    });
  };

  // User approval handlers
  const handleApproveUser = async (userId) => {
    try {
      await setUserAdminVerified(token, userId, true);
      setUsers(users.map(user => 
        user.id === userId ? { ...user, verified_by_admin: true } : user
      ));
      alert('User approved successfully!');
    } catch (error) {
      setError(error.message);
      alert('Failed to approve user');
    }
  };

  const handleBulkApprove = async () => {
    try {
      await Promise.all(selectedUsers.map(id => 
        setUserAdminVerified(token, id, true)
      ));
      setUsers(users.map(user => 
        selectedUsers.includes(user.id) 
          ? { ...user, verified_by_admin: true } 
          : user
      ));
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
      setUsers(users.map(user => 
        user.id === userId ? { ...user, verified_by_admin: false } : user
      ));
      alert('User approval revoked!');
    } catch (error) {
      setError(error.message);
      alert('Failed to revoke approval');
    }
  };

  // CRUD operations
  const handleAddUser = async () => {
    try {
      await createUser(token, formData);
      setShowAddModal(false);
      resetFormData();
      loadUsers();
      alert('User added successfully!');
    } catch (error) {
      setError(error.message);
      alert('Failed to add user');
    }
  };

  const handleEditUser = async () => {
    try {
      await updateUser(token, editUser.id, formData);
      setShowEditModal(false);
      setEditUser(null);
      resetFormData();
      loadUsers();
      alert('User updated successfully!');
    } catch (error) {
      setError(error.message);
      alert('Failed to update user');
    }
  };

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

  // Utility functions
  const filteredUsers = users.filter(user => {
    if (filter === 'verified' && !user.verified_by_admin) return false;
    if (filter === 'unverified' && user.verified_by_admin) return false;
    
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
      founder: { 
        backgroundColor: '#e7f3ff', 
        color: '#004085', 
        border: '1px solid #b8daff' 
      },
      sme: { 
        backgroundColor: '#d4edda', 
        color: '#155724', 
        border: '1px solid #c3e6cb' 
      },
      respondent: { 
        backgroundColor: '#fff3cd', 
        color: '#856404', 
        border: '1px solid #ffeaa7' 
      },
      not_selected: { 
        backgroundColor: '#f8d7da', 
        color: '#721c24', 
        border: '1px solid #f5c6cb' 
      }
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
    const baseStyle = {
      padding: '4px 8px',
      borderRadius: '12px',
      fontSize: '11px',
      fontWeight: '600'
    };

    return isApproved 
      ? {
          ...baseStyle,
          backgroundColor: '#d4edda',
          color: '#155724',
          border: '1px solid #c3e6cb'
        }
      : {
          ...baseStyle,
          backgroundColor: '#f8d7da',
          color: '#721c24',
          border: '1px solid #f5c6cb'
        };
  };

  const handleSelectUser = (userId) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const selectAllUsers = () => {
    setSelectedUsers(
      selectedUsers.length === filteredUsers.length 
        ? [] 
        : filteredUsers.map(user => user.id)
    );
  };

  const handleRowClick = (user, e) => {
    // Don't trigger if clicking on checkbox or action buttons
    if (e.target.type === 'checkbox' || 
        e.target.tagName === 'BUTTON' || 
        e.target.closest('button')) {
      return;
    }
    loadUserDetails(user.id);
  };

  if (!token) {
    return <div style={{ padding: '20px' }}>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="heading-main mb-8">User Management</h1>
      
      {/* Filters and Search */}
      <div className="card-dark card-accent p-6 mb-8 flex items-center gap-6">
        <input
          type="text"
          placeholder="Search users..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="bg-black text-purple-main border border-purple-main rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-main"
        />
        <select
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="bg-black text-purple-main border border-purple-main rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-main"
        >
          <option value="all">All</option>
          <option value="verified">Verified</option>
          <option value="unverified">Unverified</option>
        </select>
        <button 
          onClick={() => setShowAddModal(true)} 
          className="btn-primary ml-auto"
        >
          Add User
        </button>
      </div>

      {/* User Table */}
      <div className="card-dark card-accent p-6 overflow-x-auto rounded-xl">
        <table className="w-full text-sm">
          <thead>
            <tr className="table-header">
              <th className="text-center">
                <input 
                  type="checkbox" 
                  checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0} 
                  onChange={selectAllUsers} 
                />
              </th>
              <th>Email</th>
              <th>Persona Type</th>
              <th>Verified</th>
              <th>Created At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={6} className="empty-state">
                  No users found.
                </td>
              </tr>
            ) : (
              filteredUsers.map(user => (
                <tr 
                  key={user.id}
                  className={`user-row ${user.verified_by_admin ? 'verified-row' : ''}`}
                  onClick={(e) => handleRowClick(user, e)}
                >
                  <td className="text-center">
                    <input 
                      type="checkbox" 
                      checked={selectedUsers.includes(user.id)} 
                      onChange={() => handleSelectUser(user.id)} 
                    />
                  </td>
                  <td>{user.email}</td>
                  <td>
                    <span style={getPersonaTypeBadge(user.persona_type)}>
                      {user.persona_type}
                    </span>
                  </td>
                  <td>
                    <span style={getApprovalBadge(user.verified_by_admin)}>
                      {user.verified_by_admin ? 'Verified' : 'Unverified'}
                    </span>
                  </td>
                  <td>
                    {user.created_at 
                      ? new Date(user.created_at).toLocaleDateString() 
                      : '-'
                    }
                  </td>
                  <td className="action-buttons">
                    {!user.verified_by_admin && (
                      <button 
                        onClick={() => handleApproveUser(user.id)} 
                        className="btn-success"
                      >
                        Approve
                      </button>
                    )}
                    {user.verified_by_admin && (
                      <button 
                        onClick={() => handleRevokeApproval(user.id)} 
                        className="btn-danger"
                      >
                        Revoke
                      </button>
                    )}
                    <button 
                      onClick={() => { 
                        setEditUser(user); 
                        setShowEditModal(true); 
                        setFormData(user); 
                      }} 
                      className="btn-warning"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDeleteUser(user.id)} 
                      className="btn-danger"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        
        {selectedUsers.length > 0 && (
          <div className="bulk-actions">
            <button 
              onClick={handleBulkApprove} 
              className="btn-primary"
            >
              Bulk Approve Selected ({selectedUsers.length})
            </button>
          </div>
        )}
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="modal-header">Add User</h3>
            <form 
              onSubmit={e => { 
                e.preventDefault(); 
                handleAddUser(); 
              }} 
              className="modal-form"
            >
              <input 
                type="email" 
                placeholder="Email" 
                value={formData.email} 
                onChange={e => setFormData({ ...formData, email: e.target.value })} 
                required 
              />
              <input 
                type="password" 
                placeholder="Password" 
                value={formData.password} 
                onChange={e => setFormData({ ...formData, password: e.target.value })} 
                required 
              />
              <select 
                value={formData.persona_type} 
                onChange={e => setFormData({ ...formData, persona_type: e.target.value })} 
                required
              >
                <option value="">Select Persona Type</option>
                <option value="founder">Founder</option>
                <option value="sme">SME</option>
                <option value="respondent">Respondent</option>
              </select>
              <div className="modal-actions">
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)} 
                  className="btn-cancel"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Add
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="modal-header">Edit User</h3>
            <form 
              onSubmit={e => { 
                e.preventDefault(); 
                handleEditUser(); 
              }} 
              className="modal-form"
            >
              <input 
                type="email" 
                placeholder="Email" 
                value={formData.email} 
                onChange={e => setFormData({ ...formData, email: e.target.value })} 
                required 
              />
              <input 
                type="password" 
                placeholder="Password" 
                value={formData.password} 
                onChange={e => setFormData({ ...formData, password: e.target.value })} 
              />
              <select 
                value={formData.persona_type} 
                onChange={e => setFormData({ ...formData, persona_type: e.target.value })} 
                required
              >
                <option value="">Select Persona Type</option>
                <option value="founder">Founder</option>
                <option value="sme">SME</option>
                <option value="respondent">Respondent</option>
              </select>
              <div className="modal-actions">
                <button 
                  type="button" 
                  onClick={() => setShowEditModal(false)} 
                  className="btn-cancel"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* User Details Modal */}
      {showUserDetailsModal && (
        <div className="modal-overlay">
          <div className="modal-content user-details-modal">
            <div className="user-details-header">
              <h3>User Details</h3>
              <button 
                onClick={() => setShowUserDetailsModal(false)} 
                className="close-btn"
              >
                ×
              </button>
            </div>
            
            {userDetailsLoading ? (
              <div className="loading-details">
                <div className="spinner"></div>
                <span>Loading user details...</span>
              </div>
            ) : selectedUserDetails ? (
              <UserDetailsContent 
                user={selectedUserDetails}
                getPersonaTypeBadge={getPersonaTypeBadge}
                getApprovalBadge={getApprovalBadge}
              />
            ) : (
              <div className="error-loading">Failed to load user details</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Separate component for user details content
const UserDetailsContent = ({ user, getPersonaTypeBadge, getApprovalBadge }) => (
  <div className="user-details-content">
    {/* Profile Header */}
    <div className="profile-header">
      <div className="avatar-section">
        {user.avatar ? (
          <img 
            src={user.avatar} 
            alt="User Avatar" 
            className="user-avatar"
          />
        ) : (
          <div className="default-avatar">
            {user.name 
              ? user.name.charAt(0).toUpperCase() 
              : user.email.charAt(0).toUpperCase()
            }
          </div>
        )}
      </div>
      <div className="profile-info">
        <h4>{user.name || 'No name provided'}</h4>
        <p className="profile-title">{user.profile_title || 'No title provided'}</p>
        <p className="email">{user.email}</p>
      </div>
    </div>

    {/* Details Grid */}
    <div className="details-grid">
      <DetailItem label="Persona Type">
        <span style={getPersonaTypeBadge(user.persona_type)}>
          {user.persona_type}
        </span>
      </DetailItem>

      <DetailItem label="Verification Status">
        <span style={getApprovalBadge(user.verified_by_admin)}>
          {user.verified_by_admin ? 'Verified' : 'Unverified'}
        </span>
      </DetailItem>

      <DetailItem label="Industry" value={user.industry} />
      <DetailItem label="Country" value={user.country} />
      <DetailItem label="Experience" value={user.experience} />
      <DetailItem label="Age" value={user.age} />
      <DetailItem label="Gender" value={user.gender} />
      <DetailItem label="Auth Type" value={user.auth_type || 'Standard'} />
      
      <DetailItem 
        label="Created At" 
        value={user.created_at 
          ? new Date(user.created_at).toLocaleString() 
          : '-'
        } 
      />
      
      <DetailItem 
        label="Updated At" 
        value={user.updated_at 
          ? new Date(user.updated_at).toLocaleString() 
          : '-'
        } 
      />
    </div>

    {/* Description */}
    {user.description && (
      <div className="description-section">
        <label>Description</label>
        <p>{user.description}</p>
      </div>
    )}

    {/* External Links */}
    <div className="links-section">
      <label>External Links</label>
      <div className="links-grid">
        {user.linkedin && (
          <ExternalLink href={user.linkedin} type="linkedin" />
        )}
        {user.github && (
          <ExternalLink href={user.github} type="github" />
        )}
        {user.cv_url && (
          <ExternalLink href={user.cv_url} type="cv" />
        )}
      </div>
      {!user.linkedin && !user.github && !user.cv_url && (
        <p className="no-links">No external links provided</p>
      )}
    </div>

    {/* Available Time Slots */}
    {user.available_time_slots && (
      <div className="time-slots-section">
        <label>Available Time Slots</label>
        <div className="time-slots">
          <pre>{JSON.stringify(user.available_time_slots, null, 2)}</pre>
        </div>
      </div>
    )}
  </div>
);

// Helper components
const DetailItem = ({ label, value, children }) => (
  <div className="detail-item">
    <label>{label}</label>
    {children || <span>{value || 'Not specified'}</span>}
  </div>
);

const ExternalLink = ({ href, type }) => {
  const labels = {
    linkedin: 'LinkedIn',
    github: 'GitHub',
    cv: 'CV/Resume'
  };

  return (
    <a 
      href={href} 
      target="_blank" 
      rel="noopener noreferrer"
      className={`external-link ${type}`}
    >
      {labels[type]}
    </a>
  );
};

export default UserManagement;