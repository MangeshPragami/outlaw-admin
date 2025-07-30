// src/services/api.js
const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:3001';

// ===== AUTHENTICATION =====
export async function login(email, password) {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Login failed');
  return res.json();
}

// ===== USERS =====
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

// ===== IDEAS - ORIGINAL ANALYTICS FUNCTIONS =====
export async function getIdeasOverview(token) {
  const res = await fetch(`${API_BASE}/api/ideas/overview`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to fetch ideas overview');
  return res.json();
}

export async function getIdeasTrends(token) {
  const res = await fetch(`${API_BASE}/api/ideas/trends`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to fetch ideas trends');
  return res.json();
}

export async function getIdeasValidation(token) {
  const res = await fetch(`${API_BASE}/api/ideas/validation`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to fetch ideas validation');
  return res.json();
}

// ===== IDEAS - NEW MANAGEMENT FUNCTIONS =====
export async function getAllIdeas(token) {
  const res = await fetch(`${API_BASE}/api/ideas`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to fetch ideas');
  return res.json();
}

export async function getIdeaById(token, ideaId) {
  const res = await fetch(`${API_BASE}/api/ideas/${ideaId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to fetch idea details');
  return res.json();
}

export async function activateIdea(token, ideaId) {
  const res = await fetch(`${API_BASE}/api/ideas/${ideaId}/activate`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to activate idea');
  return res.json();
}

export async function deactivateIdea(token, ideaId) {
  const res = await fetch(`${API_BASE}/api/ideas/${ideaId}/deactivate`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to deactivate idea');
  return res.json();
}

export async function resetIdea(token, ideaId) {
  const res = await fetch(`${API_BASE}/api/ideas/${ideaId}/reset`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to reset idea');
  return res.json();
}

export async function updateIdeaStage(token, ideaId, stage) {
  const res = await fetch(`${API_BASE}/api/ideas/${ideaId}/stage`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ stage })
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to update idea stage');
  return res.json();
}

export async function getStudyAnalytics(token) {
  const res = await fetch(`${API_BASE}/api/ideas/analytics`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to fetch study analytics');
  return res.json();
}

// ===== DYNAMIC LENS SUGGESTIONS =====
export async function getDynamicLensSuggestions(token, ideaId) {
  const res = await fetch(`${API_BASE}/api/ideas/${ideaId}/dynamic-lens-suggestions`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to fetch dynamic lens suggestions');
  return res.json();
}

// Add these to your src/services/api.js file:

// ===== SURVEY/FORMS MANAGEMENT =====

// Get all surveys with analytics
export async function getAllSurveys(token) {
  const res = await fetch(`${API_BASE}/api/forms`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to fetch surveys');
  return res.json();
}

// Get detailed survey information
export async function getSurveyById(token, surveyId) {
  const res = await fetch(`${API_BASE}/api/forms/${surveyId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to fetch survey details');
  return res.json();
}

// Create new survey
export async function createSurvey(token, surveyData) {
  const res = await fetch(`${API_BASE}/api/forms`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(surveyData)
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to create survey');
  return res.json();
}

// Update survey
export async function updateSurvey(token, surveyId, surveyData) {
  const res = await fetch(`${API_BASE}/api/forms/${surveyId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(surveyData)
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to update survey');
  return res.json();
}

// Delete survey
export async function deleteSurvey(token, surveyId) {
  const res = await fetch(`${API_BASE}/api/forms/${surveyId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to delete survey');
  return res.json();
}

// Start survey
export async function startSurvey(token, surveyId, durationDays = null) {
  const res = await fetch(`${API_BASE}/api/forms/${surveyId}/start`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ duration_days: durationDays })
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to start survey');
  return res.json();
}

// Stop survey
export async function stopSurvey(token, surveyId) {
  const res = await fetch(`${API_BASE}/api/forms/${surveyId}/stop`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to stop survey');
  return res.json();
}

// Get survey analytics
export async function getSurveyAnalytics(token) {
  const res = await fetch(`${API_BASE}/api/forms/analytics`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to fetch survey analytics');
  return res.json();
}

// Get surveys by idea/study
export async function getSurveysByIdea(token, ideaId) {
  const res = await fetch(`${API_BASE}/api/forms/idea/${ideaId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to fetch surveys for idea');
  return res.json();
}
// ===== SME =====
export async function getSMEOverview(token) {
  const res = await fetch(`${API_BASE}/api/sme/overview`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to fetch SME overview');
  return res.json();
}

// ===== SETTINGS =====
export async function getAdminSettings(token) {
  const res = await fetch(`${API_BASE}/api/settings`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to fetch settings');
  return res.json();
}