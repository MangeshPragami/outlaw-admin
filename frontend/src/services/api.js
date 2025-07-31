// src/services/api.js
import axios from 'axios';


const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5001'; // Updated port to match server


// Create axios instance
const api = axios.create({
  baseURL: API_BASE, // Fixed variable name
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token if needed
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    
    // Handle 401 unauthorized
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      // Redirect to login if needed
      // window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

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

// ===== SURVEY/FORMS MANAGEMENT =====
export async function getAllSurveys(token) {
  const res = await fetch(`${API_BASE}/api/forms`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to fetch surveys');
  return res.json();
}

export async function getSurveyById(token, surveyId) {
  const res = await fetch(`${API_BASE}/api/forms/${surveyId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to fetch survey details');
  return res.json();
}

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

export async function deleteSurvey(token, surveyId) {
  const res = await fetch(`${API_BASE}/api/forms/${surveyId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to delete survey');
  return res.json();
}

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

export async function stopSurvey(token, surveyId) {
  const res = await fetch(`${API_BASE}/api/forms/${surveyId}/stop`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to stop survey');
  return res.json();
}

export async function getSurveyAnalytics(token) {
  const res = await fetch(`${API_BASE}/api/forms/analytics`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to fetch survey analytics');
  return res.json();
}

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

// ===== SME MANAGEMENT APIs =====

// Get all SME applications
export async function getAllSMEApplications(token, filters = {}) {
  const params = new URLSearchParams();
  if (filters.status) params.append('status', filters.status);
  if (filters.industry) params.append('industry', filters.industry);
  if (filters.experience) params.append('experience', filters.experience);
  
  const queryString = params.toString();
  const url = `${API_BASE}/api/sme/applications${queryString ? `?${queryString}` : ''}`;
  
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to fetch SME applications');
  return res.json();
}

// Approve SME application - FIXED: Changed from PUT to POST
export async function approveSMEApplication(token, smeId, approvalData) {
  const res = await fetch(`${API_BASE}/api/sme/${smeId}/approve`, {
    method: 'POST', // Changed from PUT to POST
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(approvalData)
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to approve SME application');
  return res.json();
}

// Reject SME application - FIXED: Changed from PUT to POST
export async function rejectSMEApplication(token, smeId, rejectionData) {
  const res = await fetch(`${API_BASE}/api/sme/${smeId}/reject`, {
    method: 'POST', // Changed from PUT to POST
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(rejectionData)
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to reject SME application');
  return res.json();
}

// Get SME profile details
export async function getSMEProfile(token, smeId) {
  const res = await fetch(`${API_BASE}/api/sme/${smeId}/profile`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to fetch SME profile');
  return res.json();
}

// Update SME profile
export async function updateSMEProfile(token, smeId, profileData) {
  const res = await fetch(`${API_BASE}/api/sme/${smeId}/profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(profileData)
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to update SME profile');
  return res.json();
}

// Get all approved SMEs
export async function getAllApprovedSMEs(token, filters = {}) {
  const params = new URLSearchParams();
  if (filters.expertise) params.append('expertise', filters.expertise);
  if (filters.availability) params.append('availability', filters.availability);
  if (filters.rating) params.append('rating', filters.rating);
  
  const queryString = params.toString();
  const url = `${API_BASE}/api/sme/approved${queryString ? `?${queryString}` : ''}`;
  
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to fetch approved SMEs');
  return res.json();
}

// Get SME efforts and duration tracking
export async function getSMEEfforts(token, smeId, filters = {}) {
  const params = new URLSearchParams();
  if (filters.month) params.append('month', filters.month);
  if (filters.year) params.append('year', filters.year);
  
  const queryString = params.toString();
  const url = `${API_BASE}/api/sme/${smeId}/efforts${queryString ? `?${queryString}` : ''}`;
  
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to fetch SME efforts');
  return res.json();
}

// Update SME effort record
export async function updateSMEEffortRecord(token, effortId, effortData) {
  const res = await fetch(`${API_BASE}/api/sme/efforts/${effortId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(effortData)
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to update SME effort record');
  return res.json();
}

// Get SME performance analytics - FIXED: Changed from /analytics to /performance
export async function getSMEPerformanceAnalytics(token, smeId, period = '6months') {
  const res = await fetch(`${API_BASE}/api/sme/${smeId}/performance?period=${period}`, { // Changed from /analytics to /performance
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to fetch SME performance analytics');
  return res.json();
}

// Suspend SME
export async function suspendSME(token, smeId, suspensionData) {
  const res = await fetch(`${API_BASE}/api/sme/${smeId}/suspend`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(suspensionData)
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to suspend SME');
  return res.json();
}

// Reactivate SME
export async function reactivateSME(token, smeId, reactivationData) {
  const res = await fetch(`${API_BASE}/api/sme/${smeId}/reactivate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(reactivationData)
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to reactivate SME');
  return res.json();
}

// ===== ANALYTICS API FUNCTIONS =====
export const analyticsAPI = {
  // Health check
  health: () => fetch(`${API_BASE}/api/analytics/health`).then(res => res.json()),
  
  // User analytics
  getUsersOverview: (period = 'all') => 
    fetch(`${API_BASE}/api/analytics/users/overview?period=${period}`).then(res => res.json()),
  
  getUsersGrowth: (period = '30') => 
    fetch(`${API_BASE}/api/analytics/users/growth?period=${period}`).then(res => res.json()),
  
  getUsersDemographics: () => 
    fetch(`${API_BASE}/api/analytics/users/demographics`).then(res => res.json()),
  
  // Ideas analytics
  getIdeasOverview: (period = 'all') => 
    fetch(`${API_BASE}/api/analytics/ideas/overview?period=${period}`).then(res => res.json()),
  
  // Forms analytics
  getFormsOverview: (period = 'all') => 
    fetch(`${API_BASE}/api/analytics/forms/overview?period=${period}`).then(res => res.json()),
  
  // SME analytics
  getSMEOverview: (period = 'all') => 
    fetch(`${API_BASE}/api/analytics/sme/overview?period=${period}`).then(res => res.json()),
  
  // Bookings analytics
  getBookingsOverview: (period = 'all') => 
    fetch(`${API_BASE}/api/analytics/bookings/overview?period=${period}`).then(res => res.json()),
  
  // Chime analytics
  getChimeOverview: (period = 'all') => 
    fetch(`${API_BASE}/api/analytics/chime/overview?period=${period}`).then(res => res.json()),
  
  getChimeTranscripts: (period = '30') => 
    fetch(`${API_BASE}/api/analytics/chime/transcripts?period=${period}`).then(res => res.json()),
  
  // Engagement analytics
  getEngagementFunnel: () => 
    fetch(`${API_BASE}/api/analytics/engagement/funnel`).then(res => res.json()),
  
  // Realtime analytics
  getRealtime: () => 
    fetch(`${API_BASE}/api/analytics/realtime`).then(res => res.json()),
};

// General API functions
export const generalAPI = {
  // Auth
  login: (credentials) => api.post('/api/auth/login', credentials),
  
  // Users
  getUsers: () => api.get('/api/users'),
  
  // Add other endpoints as needed
};

export default api;