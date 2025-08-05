// src/pages/Bookings.js
import React, { useState, useEffect, useCallback, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { 
  getBookingsOverview, 
  getAllBookings, 
  createBooking, 
  updateBooking, 
  deleteBooking, 
  updateBookingStatus,
  getAllUsers,
  adminJoinMeeting,
  getBookingTranscript
} from '../services/api';
import './Bookings.css';

const Bookings = () => {
  const [bookings, setBookings] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all', 'scheduled', 'completed', 'cancelled'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBookings, setSelectedBookings] = useState([]);
  const [error, setError] = useState('');
  const { token } = useContext(AuthContext);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editBooking, setEditBooking] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [formData, setFormData] = useState({
    status: 'scheduled',
    creator_id: '',
    participant_id: '',
    start_time: '',
    end_time: ''
  });

  // Load bookings from API
  const loadBookings = useCallback(async () => {
    if (!token) return;
    
    setLoading(true);
    setError('');
    try {
      const data = await getAllBookings(token);
      setBookings(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Load users for dropdowns
  const loadUsers = useCallback(async () => {
    if (!token) return;
    
    try {
      const userData = await getAllUsers(token);
      setUsers(userData);
    } catch (err) {
      console.error('Failed to load users:', err);
    }
  }, [token]);

  // Load data on component mount
  useEffect(() => {
    if (token) {
      loadBookings();
      loadUsers();
    }
  }, [token, loadBookings, loadUsers]);

  const handleStatusUpdate = async (bookingId, newStatus) => {
    try {
      await updateBookingStatus(token, bookingId, newStatus);
      setBookings(bookings.map(booking => 
        booking.id === bookingId ? { ...booking, status: newStatus } : booking
      ));
      alert('Booking status updated successfully!');
    } catch (error) {
      setError(error.message);
      alert('Failed to update booking status');
    }
  };

  const handleBulkStatusUpdate = async (newStatus) => {
    try {
      await Promise.all(
        selectedBookings.map(id => updateBookingStatus(token, id, newStatus))
      );
      setBookings(bookings.map(booking => 
        selectedBookings.includes(booking.id) ? { ...booking, status: newStatus } : booking
      ));
      setSelectedBookings([]);
      alert(`${selectedBookings.length} bookings updated successfully!`);
    } catch (error) {
      setError(error.message);
      alert('Failed to update bookings');
    }
  };

  // Add Booking
  const handleAddBooking = async () => {
    try {
      await createBooking(token, formData);
      setShowAddModal(false);
      resetFormData();
      loadBookings();
      alert('Booking added successfully!');
    } catch (error) {
      setError(error.message);
      alert('Failed to add booking');
    }
  };

  // Edit Booking
  const handleEditBooking = async () => {
    try {
      await updateBooking(token, editBooking.id, formData);
      setShowEditModal(false);
      setEditBooking(null);
      resetFormData();
      loadBookings();
      alert('Booking updated successfully!');
    } catch (error) {
      setError(error.message);
      alert('Failed to update booking');
    }
  };

  // Delete Booking
  const handleDeleteBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to delete this booking?')) return;
    try {
      await deleteBooking(token, bookingId);
      loadBookings();
      alert('Booking deleted successfully!');
    } catch (error) {
      setError(error.message);
      alert('Failed to delete booking');
    }
  };

  const resetFormData = () => {
    setFormData({
      status: 'scheduled',
      creator_id: '',
      participant_id: '',
      start_time: '',
      end_time: ''
    });
  };

  // Client-side filtering
  const filteredBookings = bookings.filter(booking => {
    // Filter by status
    if (filter !== 'all' && booking.status !== filter) return false;
    
    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        (booking.creator_email && booking.creator_email.toLowerCase().includes(searchLower)) ||
        (booking.participant_email && booking.participant_email.toLowerCase().includes(searchLower)) ||
        booking.status.toLowerCase().includes(searchLower) ||
        (booking.virtual_conference_id && booking.virtual_conference_id.toLowerCase().includes(searchLower))
      );
    }
    
    return true;
  });

  const getStatusBadge = (status) => {
    const styles = {
      scheduled: { backgroundColor: '#e7f3ff', color: '#004085', border: '1px solid #b8daff' },
      completed: { backgroundColor: '#d4edda', color: '#155724', border: '1px solid #c3e6cb' },
      cancelled: { backgroundColor: '#f8d7da', color: '#721c24', border: '1px solid #f5c6cb' },
      in_progress: { backgroundColor: '#fff3cd', color: '#856404', border: '1px solid #ffeaa7' }
    };

    return {
      padding: '4px 8px',
      borderRadius: '12px',
      fontSize: '11px',
      fontWeight: '600',
      textTransform: 'uppercase',
      ...styles[status] || styles.scheduled
    };
  };

  const handleSelectBooking = (bookingId) => {
    if (selectedBookings.includes(bookingId)) {
      setSelectedBookings(selectedBookings.filter(id => id !== bookingId));
    } else {
      setSelectedBookings([...selectedBookings, bookingId]);
    }
  };

  const selectAllBookings = () => {
    if (selectedBookings.length === filteredBookings.length) {
      setSelectedBookings([]);
    } else {
      setSelectedBookings(filteredBookings.map(booking => booking.id));
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString();
  };

  const openEditModal = (booking) => {
    setEditBooking(booking);
    setFormData({
      status: booking.status || 'scheduled',
      creator_id: booking.creator_id || '',
      participant_id: booking.participant_id || '',
      start_time: booking.start_time ? new Date(booking.start_time).toISOString().slice(0, 16) : '',
      end_time: booking.end_time ? new Date(booking.end_time).toISOString().slice(0, 16) : ''
    });
    setShowEditModal(true);
  };

  const openDetailModal = (booking) => {
    setSelectedBooking(booking);
    setShowDetailModal(true);
  };

  const handleJoinMeeting = async (bookingId) => {
    try {
      const meetingData = await adminJoinMeeting(token, bookingId);
      // Open meeting in new window or handle meeting join
      window.open(`/meeting/${meetingData.Meeting.MeetingId}`, '_blank');
    } catch (error) {
      alert('Failed to join meeting: ' + error.message);
    }
  };

  const handleViewTranscript = async (booking) => {
    if (booking.transcript_url) {
      window.open(booking.transcript_url, '_blank');
    } else {
      try {
        const transcript = await getBookingTranscript(token, booking.id);
        if (transcript.url) {
          window.open(transcript.url, '_blank');
        } else {
          alert('No transcript available yet');
        }
      } catch (error) {
        alert('Failed to get transcript: ' + error.message);
      }
    }
  };

  if (!token) {
    return <div style={{ padding: '20px' }}>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="heading-main mb-8">Bookings Management</h1>
      
      {/* Filters and Search */}
      <div className="card-dark card-accent p-6 mb-8 flex items-center gap-6">
        <input
          type="text"
          placeholder="Search bookings..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="bg-black text-purple-main border border-purple-main rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-main"
        />
        <select
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="bg-black text-purple-main border border-purple-main rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-main"
        >
          <option value="all">All Status</option>
          <option value="scheduled">Scheduled</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <button onClick={() => setShowAddModal(true)} className="btn-primary ml-auto">Add Booking</button>
      </div>

      {/* Bookings Table */}
      <div className="card-dark card-accent p-6 overflow-x-auto rounded-xl">
        <table className="w-full text-sm" style={{ minWidth: '900px', borderCollapse: 'separate', borderSpacing: '0' }}>
          <thead>
            <tr style={{ color: '#8A5CF6', borderBottom: '2px solid #8A5CF6', background: 'rgba(138,92,246,0.07)' }}>
              <th style={{ padding: '12px 8px', textAlign: 'center' }}>
                <input 
                  type="checkbox" 
                  checked={selectedBookings.length === filteredBookings.length && filteredBookings.length > 0} 
                  onChange={selectAllBookings} 
                />
              </th>
              <th style={{ padding: '12px 8px' }}>Creator</th>
              <th style={{ padding: '12px 8px' }}>Participant</th>
              <th style={{ padding: '12px 8px' }}>Status</th>
              <th style={{ padding: '12px 8px' }}>Start Time</th>
              <th style={{ padding: '12px 8px' }}>End Time</th>
              <th style={{ padding: '12px 8px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredBookings.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', color: '#8A5CF6', padding: '24px' }}>
                  No bookings found.
                </td>
              </tr>
            ) : (
              filteredBookings.map(booking => (
                <tr 
                  key={booking.id} 
                  style={{ 
                    borderBottom: '1px solid #232323', 
                    background: booking.status === 'completed' ? 'rgba(138,92,246,0.04)' : 'transparent',
                    cursor: 'pointer'
                  }}
                  onClick={() => openDetailModal(booking)}
                >
                  <td style={{ textAlign: 'center', padding: '10px 8px' }} onClick={e => e.stopPropagation()}>
                    <input 
                      type="checkbox" 
                      checked={selectedBookings.includes(booking.id)} 
                      onChange={() => handleSelectBooking(booking.id)} 
                    />
                  </td>
                  <td style={{ padding: '10px 8px' }}>{booking.creator_email || '-'}</td>
                  <td style={{ padding: '10px 8px' }}>{booking.participant_email || '-'}</td>
                  <td style={{ padding: '10px 8px' }}>
                    <span style={getStatusBadge(booking.status)}>{booking.status}</span>
                  </td>
                  <td style={{ padding: '10px 8px' }}>{formatDateTime(booking.start_time)}</td>
                  <td style={{ padding: '10px 8px' }}>{formatDateTime(booking.end_time)}</td>
                  <td style={{ padding: '10px 8px', minWidth: '200px' }} onClick={e => e.stopPropagation()}>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {booking.status === 'scheduled' && (
                        <button 
                          onClick={() => handleStatusUpdate(booking.id, 'in_progress')} 
                          className="btn-primary" 
                          style={{ padding: '4px 8px', fontSize: '12px', backgroundColor: '#28a745' }}
                        >
                          Start
                        </button>
                      )}
                      {booking.status === 'in_progress' && (
                        <button 
                          onClick={() => handleStatusUpdate(booking.id, 'completed')} 
                          className="btn-primary" 
                          style={{ padding: '4px 8px', fontSize: '12px', backgroundColor: '#17a2b8' }}
                        >
                          Complete
                        </button>
                      )}
                      {booking.status !== 'cancelled' && (
                        <button 
                          onClick={() => handleStatusUpdate(booking.id, 'cancelled')} 
                          className="btn-primary" 
                          style={{ padding: '4px 8px', fontSize: '12px', backgroundColor: '#dc3545' }}
                        >
                          Cancel
                        </button>
                      )}
                      <button 
                        onClick={() => openEditModal(booking)} 
                        className="btn-primary" 
                        style={{ padding: '4px 8px', fontSize: '12px', backgroundColor: '#ffc107', color: '#212529' }}
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDeleteBooking(booking.id)} 
                        className="btn-primary" 
                        style={{ padding: '4px 8px', fontSize: '12px', backgroundColor: '#dc3545' }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {selectedBookings.length > 0 && (
          <div style={{ marginTop: '16px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button 
              onClick={() => handleBulkStatusUpdate('completed')} 
              className="btn-primary" 
              style={{ padding: '8px 20px', fontWeight: '600', fontSize: '14px', backgroundColor: '#28a745' }}
            >
              Mark Selected as Completed
            </button>
            <button 
              onClick={() => handleBulkStatusUpdate('cancelled')} 
              className="btn-primary" 
              style={{ padding: '8px 20px', fontWeight: '600', fontSize: '14px', backgroundColor: '#dc3545' }}
            >
              Cancel Selected
            </button>
          </div>
        )}
      </div>

      {/* Booking Detail Modal */}
      {showDetailModal && selectedBooking && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#1e1e2e', padding: '32px', borderRadius: '16px', width: '700px', border: '1.5px solid #8A5CF6', boxShadow: '0 8px 32px 0 rgba(138,92,246,0.18)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ margin: 0, color: '#8A5CF6', fontWeight: 700, fontSize: '1.3rem' }}>Booking Details</h3>
              <button 
                onClick={() => setShowDetailModal(false)}
                style={{ background: 'none', border: 'none', color: '#8A5CF6', fontSize: '24px', cursor: 'pointer' }}
              >
                ×
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              <div>
                <label style={{ color: '#8A5CF6', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>Booking ID</label>
                <div style={{ color: 'white', marginBottom: '12px' }}>{selectedBooking.id}</div>
              </div>
              <div>
                <label style={{ color: '#8A5CF6', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>Status</label>
                <div style={{ marginBottom: '12px' }}>
                  <span style={getStatusBadge(selectedBooking.status)}>{selectedBooking.status}</span>
                </div>
              </div>
              <div>
                <label style={{ color: '#8A5CF6', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>Creator</label>
                <div style={{ color: 'white', marginBottom: '12px' }}>{selectedBooking.creator_email || '-'}</div>
              </div>
              <div>
                <label style={{ color: '#8A5CF6', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>Participant</label>
                <div style={{ color: 'white', marginBottom: '12px' }}>{selectedBooking.participant_email || '-'}</div>
              </div>
              <div>
                <label style={{ color: '#8A5CF6', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>Start Time</label>
                <div style={{ color: 'white', marginBottom: '12px' }}>{formatDateTime(selectedBooking.start_time)}</div>
              </div>
              <div>
                <label style={{ color: '#8A5CF6', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>End Time</label>
                <div style={{ color: 'white', marginBottom: '12px' }}>{formatDateTime(selectedBooking.end_time)}</div>
              </div>
              <div>
                <label style={{ color: '#8A5CF6', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>Created At</label>
                <div style={{ color: 'white', marginBottom: '12px' }}>{formatDateTime(selectedBooking.created_at)}</div>
              </div>
              <div>
                <label style={{ color: '#8A5CF6', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>Updated At</label>
                <div style={{ color: 'white', marginBottom: '12px' }}>{formatDateTime(selectedBooking.updated_at)}</div>
              </div>
            </div>

            {/* Meeting Details Section */}
            <div style={{ borderTop: '1px solid #333', paddingTop: '20px', marginBottom: '20px' }}>
              <h4 style={{ color: '#8A5CF6', marginBottom: '16px', fontSize: '1.1rem' }}>Meeting Details</h4>
              
              <div style={{ marginBottom: '16px' }}>
                <label style={{ color: '#8A5CF6', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>Virtual Conference ID</label>
                <div style={{ color: 'white', fontFamily: 'monospace', fontSize: '13px' }}>
                  {selectedBooking.virtual_conference_id || 'Not assigned'}
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ color: '#8A5CF6', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>Transcript URL</label>
                <div style={{ color: 'white' }}>
                  {selectedBooking.transcript_url ? (
                    <a 
                      href={selectedBooking.transcript_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{ color: '#17a2b8', textDecoration: 'underline' }}
                    >
                      View Transcript
                    </a>
                  ) : (
                    'No transcript available'
                  )}
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ color: '#8A5CF6', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>Video Recording URL</label>
                <div style={{ color: 'white' }}>
                  {selectedBooking.video_recording_url ? (
                    <a 
                      href={selectedBooking.video_recording_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{ color: '#17a2b8', textDecoration: 'underline' }}
                    >
                      View Recording
                    </a>
                  ) : (
                    'No recording available'
                  )}
                </div>
              </div>

              {/* Chime Meeting Response */}
              {selectedBooking.chime_meeting_response && (
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ color: '#8A5CF6', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>Chime Meeting</label>
                  <div style={{ 
                    backgroundColor: '#0f0f23', 
                    border: '1px solid #333', 
                    borderRadius: '8px', 
                    padding: '12px', 
                    marginTop: '8px'
                  }}>
                    <div style={{ marginBottom: '8px' }}>
                      <span style={{ color: '#8A5CF6', fontSize: '12px' }}>Meeting ID:</span>
                      <span style={{ color: 'white', marginLeft: '8px', fontFamily: 'monospace' }}>
                        {selectedBooking.chime_meeting_response.meetingResponse?.Meeting?.MeetingId || selectedBooking.virtual_conference_id}
                      </span>
                    </div>
                    <div style={{ marginBottom: '8px' }}>
                      <span style={{ color: '#8A5CF6', fontSize: '12px' }}>Attendees:</span>
                      <span style={{ color: 'white', marginLeft: '8px' }}>
                        {selectedBooking.chime_meeting_response.attendeeResponses?.length || 0} participants
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                      <button 
                        onClick={() => handleJoinMeeting(selectedBooking.id)}
                        className="btn-primary"
                        style={{ 
                          padding: '6px 12px', 
                          fontSize: '12px', 
                          backgroundColor: '#17a2b8'
                        }}
                      >
                        Join Meeting
                      </button>
                      <button 
                        onClick={() => handleViewTranscript(selectedBooking)}
                        className="btn-primary"
                        style={{ 
                          padding: '6px 12px', 
                          fontSize: '12px', 
                          backgroundColor: '#6f42c1'
                        }}
                      >
                        View Transcript
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => setShowDetailModal(false)}
                className="btn-primary"
                style={{ padding: '8px 20px', fontWeight: 600 }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Booking Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#1e1e2e', padding: '32px', borderRadius: '16px', width: '500px', border: '1.5px solid #8A5CF6', boxShadow: '0 8px 32px 0 rgba(138,92,246,0.18)', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ marginTop: 0, color: '#8A5CF6', fontWeight: 700, fontSize: '1.3rem' }}>Add Booking</h3>
            <form onSubmit={e => { e.preventDefault(); handleAddBooking(); }}>
              <select 
                value={formData.creator_id} 
                onChange={e => setFormData({ ...formData, creator_id: e.target.value })} 
                required 
                style={{ width: '100%', marginBottom: '14px', padding: '10px', border: '1.5px solid #8A5CF6', borderRadius: '8px', backgroundColor: '#121212', color: 'white', fontSize: '1rem' }}
              >
                <option value="">Select Creator</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>{user.email}</option>
                ))}
              </select>
              
              <select 
                value={formData.participant_id} 
                onChange={e => setFormData({ ...formData, participant_id: e.target.value })} 
                required 
                style={{ width: '100%', marginBottom: '14px', padding: '10px', border: '1.5px solid #8A5CF6', borderRadius: '8px', backgroundColor: '#121212', color: 'white', fontSize: '1rem' }}
              >
                <option value="">Select Participant</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>{user.email}</option>
                ))}
              </select>

              <select 
                value={formData.status} 
                onChange={e => setFormData({ ...formData, status: e.target.value })} 
                required 
                style={{ width: '100%', marginBottom: '14px', padding: '10px', border: '1.5px solid #8A5CF6', borderRadius: '8px', backgroundColor: '#121212', color: 'white', fontSize: '1rem' }}
              >
                <option value="scheduled">Scheduled</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>

              <input 
                type="datetime-local" 
                placeholder="Start Time" 
                value={formData.start_time} 
                onChange={e => setFormData({ ...formData, start_time: e.target.value })} 
                required 
                style={{ width: '100%', marginBottom: '14px', padding: '10px', border: '1.5px solid #8A5CF6', borderRadius: '8px', backgroundColor: '#121212', color: 'white', fontSize: '1rem' }} 
              />

              <input 
                type="datetime-local" 
                placeholder="End Time" 
                value={formData.end_time} 
                onChange={e => setFormData({ ...formData, end_time: e.target.value })} 
                required 
                style={{ width: '100%', marginBottom: '14px', padding: '10px', border: '1.5px solid #8A5CF6', borderRadius: '8px', backgroundColor: '#121212', color: 'white', fontSize: '1rem' }} 
              />

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '18px' }}>
                <button 
                  type="button" 
                  onClick={() => { setShowAddModal(false); resetFormData(); }} 
                  style={{ padding: '8px 16px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary" 
                  style={{ padding: '8px 20px', fontWeight: 600 }}
                >
                  Add Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Booking Modal */}
      {showEditModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#1e1e2e', padding: '32px', borderRadius: '16px', width: '500px', border: '1.5px solid #8A5CF6', boxShadow: '0 8px 32px 0 rgba(138,92,246,0.18)', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ marginTop: 0, color: '#8A5CF6', fontWeight: 700, fontSize: '1.3rem' }}>Edit Booking</h3>
            <form onSubmit={e => { e.preventDefault(); handleEditBooking(); }}>
              <select 
                value={formData.creator_id} 
                onChange={e => setFormData({ ...formData, creator_id: e.target.value })} 
                required 
                style={{ width: '100%', marginBottom: '14px', padding: '10px', border: '1.5px solid #8A5CF6', borderRadius: '8px', backgroundColor: '#121212', color: 'white', fontSize: '1rem' }}
              >
                <option value="">Select Creator</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>{user.email}</option>
                ))}
              </select>
              
              <select 
                value={formData.participant_id} 
                onChange={e => setFormData({ ...formData, participant_id: e.target.value })} 
                required 
                style={{ width: '100%', marginBottom: '14px', padding: '10px', border: '1.5px solid #8A5CF6', borderRadius: '8px', backgroundColor: '#121212', color: 'white', fontSize: '1rem' }}
              >
                <option value="">Select Participant</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>{user.email}</option>
                ))}
              </select>

              <select 
                value={formData.status} 
                onChange={e => setFormData({ ...formData, status: e.target.value })} 
                required 
                style={{ width: '100%', marginBottom: '14px', padding: '10px', border: '1.5px solid #8A5CF6', borderRadius: '8px', backgroundColor: '#121212', color: 'white', fontSize: '1rem' }}
              >
                <option value="scheduled">Scheduled</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>

              <input 
                type="datetime-local" 
                placeholder="Start Time" 
                value={formData.start_time} 
                onChange={e => setFormData({ ...formData, start_time: e.target.value })} 
                required 
                style={{ width: '100%', marginBottom: '14px', padding: '10px', border: '1.5px solid #8A5CF6', borderRadius: '8px', backgroundColor: '#121212', color: 'white', fontSize: '1rem' }} 
              />

              <input 
                type="datetime-local" 
                placeholder="End Time" 
                value={formData.end_time} 
                onChange={e => setFormData({ ...formData, end_time: e.target.value })} 
                required 
                style={{ width: '100%', marginBottom: '14px', padding: '10px', border: '1.5px solid #8A5CF6', borderRadius: '8px', backgroundColor: '#121212', color: 'white', fontSize: '1rem' }} 
              />

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '18px' }}>
                <button 
                  type="button" 
                  onClick={() => { setShowEditModal(false); setEditBooking(null); resetFormData(); }} 
                  style={{ padding: '8px 16px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary" 
                  style={{ padding: '8px 20px', fontWeight: 600 }}
                >
                  Update Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Bookings;