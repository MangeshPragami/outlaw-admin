import React, { useState, useEffect, useCallback, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { getUsersOverview, getAllUsers, setUserAdminVerified, createUser, updateUser, deleteUser } from '../services/api';
import './UserManagement.css';

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
        <button onClick={() => setShowAddModal(true)} className="btn-primary ml-auto">Add User</button>
      </div>
      {/* User Table */}
      <div className="card-dark card-accent p-6 overflow-x-auto rounded-xl">
        <table className="w-full text-sm" style={{ minWidth: '700px', borderCollapse: 'separate', borderSpacing: '0' }}>
          <thead>
            <tr style={{ color: '#8A5CF6', borderBottom: '2px solid #8A5CF6', background: 'rgba(138,92,246,0.07)' }}>
              <th style={{ padding: '12px 8px', textAlign: 'center' }}><input type="checkbox" checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0} onChange={selectAllUsers} /></th>
              <th style={{ padding: '12px 8px' }}>Email</th>
              <th style={{ padding: '12px 8px' }}>Persona Type</th>
              <th style={{ padding: '12px 8px' }}>Verified</th>
              <th style={{ padding: '12px 8px' }}>Created At</th>
              <th style={{ padding: '12px 8px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', color: '#8A5CF6', padding: '24px' }}>No users found.</td></tr>
            ) : (
              filteredUsers.map(user => (
                <tr key={user.id} style={{ borderBottom: '1px solid #232323', background: user.verified_by_admin ? 'rgba(138,92,246,0.04)' : 'transparent' }}>
                  <td style={{ textAlign: 'center', padding: '10px 8px' }}><input type="checkbox" checked={selectedUsers.includes(user.id)} onChange={() => handleSelectUser(user.id)} /></td>
                  <td style={{ padding: '10px 8px' }}>{user.email}</td>
                  <td style={{ padding: '10px 8px' }}><span style={getPersonaTypeBadge(user.persona_type)}>{user.persona_type}</span></td>
                  <td style={{ padding: '10px 8px' }}><span style={getApprovalBadge(user.verified_by_admin)}>{user.verified_by_admin ? 'Verified' : 'Unverified'}</span></td>
                  <td style={{ padding: '10px 8px' }}>{user.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}</td>
                  <td style={{ padding: '10px 8px', minWidth: '180px' }}>
                    {!user.verified_by_admin && (
                      <button onClick={() => handleApproveUser(user.id)} className="btn-primary" style={{ marginRight: '8px', padding: '4px 12px', fontSize: '12px', minWidth: '70px' }}>Approve</button>
                    )}
                    {user.verified_by_admin && (
                      <button onClick={() => handleRevokeApproval(user.id)} className="btn-primary" style={{ backgroundColor: '#dc3545', marginRight: '8px', padding: '4px 12px', fontSize: '12px', minWidth: '70px' }}>Revoke</button>
                    )}
                    <button onClick={() => { setEditUser(user); setShowEditModal(true); setFormData(user); }} className="btn-primary" style={{ backgroundColor: '#ffc107', color: '#212529', padding: '4px 12px', fontSize: '12px', minWidth: '70px' }}>Edit</button>
                    <button onClick={() => handleDeleteUser(user.id)} className="btn-primary" style={{ backgroundColor: '#dc3545', marginLeft: '8px', padding: '4px 12px', fontSize: '12px', minWidth: '70px' }}>Delete</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {selectedUsers.length > 0 && (
          <div style={{ marginTop: '16px', textAlign: 'right' }}>
            <button onClick={handleBulkApprove} className="btn-primary" style={{ padding: '8px 20px', fontWeight: '600', fontSize: '14px' }}>Bulk Approve Selected</button>
          </div>
        )}
      </div>
      {/* Add/Edit User Modals */}
      {showAddModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#1e1e2e', padding: '32px', borderRadius: '16px', width: '400px', border: '1.5px solid #8A5CF6', boxShadow: '0 8px 32px 0 rgba(138,92,246,0.18)' }}>
            <h3 style={{ marginTop: 0, color: '#8A5CF6', fontWeight: 700, fontSize: '1.3rem' }}>Add User</h3>
            <form onSubmit={e => { e.preventDefault(); handleAddUser(); }}>
              <input type="email" placeholder="Email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required style={{ width: '100%', marginBottom: '14px', padding: '10px', border: '1.5px solid #8A5CF6', borderRadius: '8px', backgroundColor: '#121212', color: 'white', fontSize: '1rem' }} />
              <input type="password" placeholder="Password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} required style={{ width: '100%', marginBottom: '14px', padding: '10px', border: '1.5px solid #8A5CF6', borderRadius: '8px', backgroundColor: '#121212', color: 'white', fontSize: '1rem' }} />
              <select value={formData.persona_type} onChange={e => setFormData({ ...formData, persona_type: e.target.value })} required style={{ width: '100%', marginBottom: '14px', padding: '10px', border: '1.5px solid #8A5CF6', borderRadius: '8px', backgroundColor: '#121212', color: 'white', fontSize: '1rem' }}>
                <option value="">Select Persona Type</option>
                <option value="founder">Founder</option>
                <option value="sme">SME</option>
                <option value="respondent">Respondent</option>
              </select>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '18px' }}>
                <button type="button" onClick={() => setShowAddModal(false)} style={{ padding: '8px 16px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ padding: '8px 20px', fontWeight: 600 }}>Add</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showEditModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#1e1e2e', padding: '32px', borderRadius: '16px', width: '400px', border: '1.5px solid #8A5CF6', boxShadow: '0 8px 32px 0 rgba(138,92,246,0.18)' }}>
            <h3 style={{ marginTop: 0, color: '#8A5CF6', fontWeight: 700, fontSize: '1.3rem' }}>Edit User</h3>
            <form onSubmit={e => { e.preventDefault(); handleEditUser(); }}>
              <input type="email" placeholder="Email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required style={{ width: '100%', marginBottom: '14px', padding: '10px', border: '1.5px solid #8A5CF6', borderRadius: '8px', backgroundColor: '#121212', color: 'white', fontSize: '1rem' }} />
              <input type="password" placeholder="Password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} style={{ width: '100%', marginBottom: '14px', padding: '10px', border: '1.5px solid #8A5CF6', borderRadius: '8px', backgroundColor: '#121212', color: 'white', fontSize: '1rem' }} />
              <select value={formData.persona_type} onChange={e => setFormData({ ...formData, persona_type: e.target.value })} required style={{ width: '100%', marginBottom: '14px', padding: '10px', border: '1.5px solid #8A5CF6', borderRadius: '8px', backgroundColor: '#121212', color: 'white', fontSize: '1rem' }}>
                <option value="">Select Persona Type</option>
                <option value="founder">Founder</option>
                <option value="sme">SME</option>
                <option value="respondent">Respondent</option>
              </select>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '18px' }}>
                <button type="button" onClick={() => setShowEditModal(false)} style={{ padding: '8px 16px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ padding: '8px 20px', fontWeight: 600 }}>Update</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;