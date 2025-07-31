// src/services/api.js
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:3001';

// Axios instance
const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      // window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Helper for fetch with auth
async function fetchWithAuth(url, token, base = API_BASE, options = {}) {
  const opts = {
    headers: { Authorization: `Bearer ${token}` },
    ...options,
  };
  if (opts.body && !opts.headers['Content-Type']) {
    opts.headers['Content-Type'] = 'application/json';
  }
  const res = await fetch(`${base}/api${url}`, opts);
  if (!res.ok) throw new Error((await res.json()).error || 'API request failed');
  return res.json();
}

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
  return fetchWithAuth('/users/overview', token);
}

export async function getAllUsers(token) {
  return fetchWithAuth('/users', token);
}

export async function createUser(token, userData) {
  return fetchWithAuth('/users', token, API_BASE, {
    method: 'POST',
    body: JSON.stringify(userData),
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
  });
}

export async function updateUser(token, userId, userData) {
  return fetchWithAuth(`/users/${userId}`, token, API_BASE, {
    method: 'PUT',
    body: JSON.stringify(userData),
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
  });
}

export async function deleteUser(token, userId) {
  return fetchWithAuth(`/users/${userId}`, token, API_BASE, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });
}

export async function setUserAdminVerified(token, userId, verified) {
  return fetchWithAuth(`/users/${userId}/verify`, token, API_BASE, {
    method: 'PUT',
    body: JSON.stringify({ verified_by_admin: verified }),
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
  });
}

// ===== IDEAS =====
export async function getIdeasOverview(token) {
  return fetchWithAuth('/ideas/overview', token);
}

export async function getIdeasTrends(token) {
  return fetchWithAuth('/ideas/trends', token);
}

export async function getIdeasValidation(token) {
  return fetchWithAuth('/ideas/validation', token);
}

export async function getAllIdeas(token) {
  return fetchWithAuth('/ideas', token);
}

export async function getIdeaById(token, ideaId) {
  return fetchWithAuth(`/ideas/${ideaId}`, token);
}

export async function activateIdea(token, ideaId) {
  return fetchWithAuth(`/ideas/${ideaId}/activate`, token, API_BASE, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  });
}

export async function deactivateIdea(token, ideaId) {
  return fetchWithAuth(`/ideas/${ideaId}/deactivate`, token, API_BASE, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  });
}

export async function resetIdea(token, ideaId) {
  return fetchWithAuth(`/ideas/${ideaId}/reset`, token, API_BASE, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  });
}

export async function updateIdeaStage(token, ideaId, stage) {
  return fetchWithAuth(`/ideas/${ideaId}/stage`, token, API_BASE, {
    method: 'PUT',
    body: JSON.stringify({ stage }),
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
  });
}

export async function getStudyAnalytics(token) {
  return fetchWithAuth('/ideas/analytics', token);
}

// ===== DYNAMIC LENS SUGGESTIONS =====
export async function getDynamicLensSuggestions(token, ideaId) {
  return fetchWithAuth(`/ideas/${ideaId}/dynamic-lens-suggestions`, token);
}

// ===== SURVEY/FORMS MANAGEMENT =====
export async function getAllSurveys(token) {
  return fetchWithAuth('/forms', token);
}

export async function getSurveyById(token, surveyId) {
  return fetchWithAuth(`/forms/${surveyId}`, token);
}

export async function createSurvey(token, surveyData) {
  return fetchWithAuth('/forms', token, API_BASE, {
    method: 'POST',
    body: JSON.stringify(surveyData),
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
  });
}

export async function updateSurvey(token, surveyId, surveyData) {
  return fetchWithAuth(`/forms/${surveyId}`, token, API_BASE, {
    method: 'PUT',
    body: JSON.stringify(surveyData),
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
  });
}

export async function deleteSurvey(token, surveyId) {
  return fetchWithAuth(`/forms/${surveyId}`, token, API_BASE, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });
}

export async function startSurvey(token, surveyId, durationDays = null) {
  return fetchWithAuth(`/forms/${surveyId}/start`, token, API_BASE, {
    method: 'POST',
    body: JSON.stringify({ duration_days: durationDays }),
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
  });
}

export async function stopSurvey(token, surveyId) {
  return fetchWithAuth(`/forms/${surveyId}/stop`, token, API_BASE, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  });
}

export async function getSurveyAnalytics(token) {
  return fetchWithAuth('/forms/analytics', token);
}

export async function getSurveysByIdea(token, ideaId) {
  return fetchWithAuth(`/forms/idea/${ideaId}`, token);
}

// ===== SME MANAGEMENT APIs =====

// SME Applications
export async function getSMEApplications(token, status = 'pending') {
  return fetchWithAuth(`/sme/applications?status=${status}`, token);
}

export async function approveSMEApplication(token, id, reason) {
  return fetchWithAuth(`/sme/applications/${id}/approve`, token, API_BASE, {
    method: 'POST',
    body: JSON.stringify({ reason }),
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
  });
}

export async function rejectSMEApplication(token, id, reason) {
  return fetchWithAuth(`/sme/applications/${id}/reject`, token, API_BASE, {
    method: 'POST',
    body: JSON.stringify({ reason }),
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
  });
}

export async function bulkSMEAction(token, ids, action, reason) {
  return fetchWithAuth(`/sme/applications/bulk-action`, token, API_BASE, {
    method: 'POST',
    body: JSON.stringify({ ids, action, reason }),
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
  });
}

// SME Profiles
export async function getSMEProfiles(token) {
  return fetchWithAuth('/sme/profiles', token);
}

export async function updateSMEProfile(token, id, data) {
  return fetchWithAuth(`/sme/profiles/${id}`, token, API_BASE, {
    method: 'PUT',
    body: JSON.stringify(data),
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
  });
}

export async function updateSMEAvailability(token, id, available_time_slots) {
  return fetchWithAuth(`/sme/profiles/${id}/availability`, token, API_BASE, {
    method: 'POST',
    body: JSON.stringify({ available_time_slots }),
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
  });
}

// SME Efforts & Payout Tracking (Placeholder)
export async function getSMEEfforts(token) {
  // Placeholder endpoint
  return fetchWithAuth('/sme/efforts', token);
}

// Chime Meeting Management (Placeholder)
export async function getSMEMeetings(token) {
  // Placeholder endpoint
  return fetchWithAuth('/sme/meetings', token);
}

// ===== SETTINGS API =====
export async function getAdminSettings(token) {
  return fetchWithAuth('/settings', token);
}

// ===== ANALYTICS API FUNCTIONS =====
export const analyticsAPI = {
  health: () => fetch(`${API_BASE}/api/analytics/health`).then(res => res.json()),
  getUsersOverview: (period = 'all') =>
    fetch(`${API_BASE}/api/analytics/users/overview?period=${period}`).then(res => res.json()),
  getUsersGrowth: (period = '30') =>
    fetch(`${API_BASE}/api/analytics/users/growth?period=${period}`).then(res => res.json()),
  getUsersDemographics: () =>
    fetch(`${API_BASE}/api/analytics/users/demographics`).then(res => res.json()),
  getIdeasOverview: (period = 'all') =>
    fetch(`${API_BASE}/api/analytics/ideas/overview?period=${period}`).then(res => res.json()),
  getFormsOverview: (period = 'all') =>
    fetch(`${API_BASE}/api/analytics/forms/overview?period=${period}`).then(res => res.json()),
  getSMEOverview: (period = 'all') =>
    fetch(`${API_BASE}/api/analytics/sme/overview?period=${period}`).then(res => res.json()),
  getBookingsOverview: (period = 'all') =>
    fetch(`${API_BASE}/api/analytics/bookings/overview?period=${period}`).then(res => res.json()),
  getChimeOverview: (period = 'all') =>
    fetch(`${API_BASE}/api/analytics/chime/overview?period=${period}`).then(res => res.json()),
  getChimeTranscripts: (period = '30') =>
    fetch(`${API_BASE}/api/analytics/chime/transcripts?period=${period}`).then(res => res.json()),
  getEngagementFunnel: () =>
    fetch(`${API_BASE}/api/analytics/engagement/funnel`).then(res => res.json()),
  getRealtime: () =>
    fetch(`${API_BASE}/api/analytics/realtime`).then(res => res.json()),
};

// General API functions
export const generalAPI = {
  login: (credentials) => api.post('/api/auth/login', credentials),
  getUsers: () => api.get('/api/users'),
  // Add other endpoints as needed
};

export default api;
