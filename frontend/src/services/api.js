export async function setUserAdminVerified(token, userId, verified) {
  const res = await fetch(`${API_BASE}/api/users/${userId}/verify`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ verified_by_admin: verified })
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to update admin verification');
  return res.json();
}
// src/services/api.js
const API_BASE = process.env.REACT_APP_API_BASE || '';

export async function login(email, password) {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Login failed');
  return res.json();
}

export async function getUsersOverview(token) {
  const res = await fetch(`${API_BASE}/api/users/overview`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to fetch users overview');
  return res.json();
}

export async function getAllUsers(token) {
  const res = await fetch(`${API_BASE}/api/users`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to fetch users');
  return res.json();
}

export async function getIdeasOverview(token) {
  const res = await fetch(`${API_BASE}/api/ideas/overview`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to fetch ideas overview');
  return res.json();
}

export async function getFormsOverview(token) {
  const res = await fetch(`${API_BASE}/api/forms/overview`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to fetch forms overview');
  return res.json();
}

export async function getSMEOverview(token) {
  const res = await fetch(`${API_BASE}/api/sme/overview`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to fetch SME overview');
  return res.json();
}

export async function getAdminSettings(token) {
  const res = await fetch(`${API_BASE}/api/settings`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to fetch settings');
  return res.json();
}

export async function createUser(token, userData) {
  const res = await fetch(`${API_BASE}/api/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(userData)
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to create user');
  return res.json();
}

export async function updateUser(token, userId, userData) {
  const res = await fetch(`${API_BASE}/api/users/${userId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(userData)
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to update user');
  return res.json();
}

export async function deleteUser(token, userId) {
  const res = await fetch(`${API_BASE}/api/users/${userId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to delete user');
  return res.json();
}
