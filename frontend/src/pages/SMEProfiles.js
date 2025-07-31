import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { getSMEProfiles, updateSMEProfile, updateSMEAvailability } from '../services/api';

const SMEProfiles = () => {
  const { token } = useContext(AuthContext);
  const [profiles, setProfiles] = useState([]);
  const [edit, setEdit] = useState(null);

  useEffect(() => {
    getSMEProfiles(token).then(setProfiles);
  }, [token]);

  const handleEdit = (profile) => setEdit(profile);
  const handleSave = () => {
    updateSMEProfile(token, edit.id, edit).then(() => setEdit(null));
  };
  const handleAvailability = (profile, available_time_slots) => {
    updateSMEAvailability(token, profile.id, available_time_slots).then(() => {});
  };

  return (
    <div>
      <h2>SME Profiles</h2>
      <table>
        <thead>
          <tr>
            <th>Name</th><th>Email</th><th>Industry</th><th>Expertise</th><th>Availability</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {profiles.map(profile => (
            <tr key={profile.id}>
              <td>{profile.name}</td>
              <td>{profile.email}</td>
              <td>{profile.industry}</td>
              <td>{profile.expertise_tags?.join(', ')}</td>
              <td>
                <button onClick={() => handleAvailability(profile, !profile.available_time_slots)}>
                  {profile.available_time_slots ? 'Available' : 'Unavailable'}
                </button>
              </td>
              <td>
                <button onClick={() => handleEdit(profile)}>Edit</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {edit && (
        <div className="modal">
          <h3>Edit SME Profile</h3>
          <input value={edit.name} onChange={e => setEdit({ ...edit, name: e.target.value })} />
          <input value={edit.industry} onChange={e => setEdit({ ...edit, industry: e.target.value })} />
          <input value={edit.expertise_tags} onChange={e => setEdit({ ...edit, expertise_tags: e.target.value.split(',') })} />
          <button onClick={handleSave}>Save</button>
          <button onClick={() => setEdit(null)}>Cancel</button>
        </div>
      )}
    </div>
  );
};

export default SMEProfiles;