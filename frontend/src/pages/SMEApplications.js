import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { getSMEApplications, approveSMEApplication, rejectSMEApplication, bulkSMEAction } from '../services/api';

const SMEApplications = () => {
  const { token } = useContext(AuthContext);
  const [applications, setApplications] = useState([]);
  const [filter, setFilter] = useState('pending');
  const [selected, setSelected] = useState([]);
  const [modal, setModal] = useState(null);
  const [reason, setReason] = useState('');
  const [bulkReason, setBulkReason] = useState('');

  useEffect(() => {
    getSMEApplications(token, filter).then(setApplications);
  }, [token, filter]);

  const handleApprove = (id) => {
    approveSMEApplication(token, id, reason).then(() => setModal(null));
  };
  const handleReject = (id) => {
    rejectSMEApplication(token, id, reason).then(() => setModal(null));
  };
  const handleBulk = (action) => {
    bulkSMEAction(token, selected, action, bulkReason).then(() => setSelected([]));
  };

  return (
    <div>
      <h2>SME Applications</h2>
      <select value={filter} onChange={e => setFilter(e.target.value)}>
        <option value="pending">Pending</option>
        <option value="approved">Approved</option>
        <option value="rejected">Rejected</option>
      </select>
      <button disabled={selected.length === 0} onClick={() => handleBulk('approved')}>Bulk Approve</button>
      <button disabled={selected.length === 0} onClick={() => handleBulk('rejected')}>Bulk Reject</button>
      <input value={bulkReason} onChange={e => setBulkReason(e.target.value)} placeholder="Bulk reason" />
      <table>
        <thead>
          <tr>
            <th><input type="checkbox" onChange={e => setSelected(e.target.checked ? applications.map(a => a.id) : [])} /></th>
            <th>Name</th><th>Email</th><th>Status</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {applications.map(app => (
            <tr key={app.id}>
              <td><input type="checkbox" checked={selected.includes(app.id)} onChange={e => setSelected(e.target.checked ? [...selected, app.id] : selected.filter(id => id !== app.id))} /></td>
              <td>{app.name}</td>
              <td>{app.email}</td>
              <td>{app.application_status}</td>
              <td>
                <button onClick={() => setModal(app)}>Details</button>
                {app.application_status === 'pending' && (
                  <>
                    <button onClick={() => handleApprove(app.id)}>Approve</button>
                    <button onClick={() => handleReject(app.id)}>Reject</button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {modal && (
        <div className="modal">
          <h3>SME Application Details</h3>
          <pre>{JSON.stringify(modal, null, 2)}</pre>
          <input value={reason} onChange={e => setReason(e.target.value)} placeholder="Reason" />
          <button onClick={() => handleApprove(modal.id)}>Approve</button>
          <button onClick={() => handleReject(modal.id)}>Reject</button>
          <button onClick={() => setModal(null)}>Close</button>
        </div>
      )}
    </div>
  );
};

export default SMEApplications;