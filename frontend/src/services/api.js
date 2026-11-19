import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => {
    const formData = new URLSearchParams();
    formData.append('username', data.email);
    formData.append('password', data.password);
    return api.post('/auth/login', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
  },
  getMe: () => api.get('/auth/me'),
};

// Sessions
export const sessionApi = {
  create: (data) => api.post('/sessions', data),
  getActive: () => api.get('/sessions/active'),
  getById: (id) => api.get(`/sessions/${id}`),
  list: (limit = 20) => api.get(`/sessions?limit=${limit}`),
  pause: (id) => api.post(`/sessions/${id}/pause`),
  resume: (id) => api.post(`/sessions/${id}/resume`),
  end: (id) => api.post(`/sessions/${id}/end`),
  toggleTask: (sessionId, taskId) =>
    api.patch(`/sessions/${sessionId}/tasks/${taskId}`),
};

// Documents
export const documentApi = {
  upload: (formData) =>
    api.post('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  getDocuments: () => api.get('/documents'),
  delete: (id) => api.delete(`/documents/${id}`),
};

// Assistant
export const assistantApi = {
  summarize: (data) => api.post('/assistant/summary', data),
  chat: (data) => api.post('/assistant/chat', data),
  flashcards: (data) => api.post('/assistant/flashcards', data),
  quiz: (data) => api.post('/assistant/quiz', data),
  practiceHistory: (type, limit = 10) => {
    const params = new URLSearchParams();
    if (type) params.append('type', type);
    params.append('limit', limit);
    return api.get(`/assistant/practice/history?${params.toString()}`);
  },
  practiceDetail: (id) => api.get(`/assistant/practice/history/${id}`),
  practiceDelete: (id) => api.delete(`/assistant/practice/history/${id}`),
};

// MindGuard
export const mindguardApi = {
  status: () => api.get('/mindguard/status'),
  live: () => api.get('/mindguard/live'),
  extensionStatus: () => api.get('/mindguard/extension-status'),
  sendActivity: (data) => api.post('/mindguard/activity', data),
  listBlocked: () => api.get('/mindguard/blocked-websites'),
  addBlocked: (domain) => api.post('/mindguard/blocked-websites', { domain }),
  deleteBlocked: (id) => api.delete(`/mindguard/blocked-websites/${id}`),
};

// Analytics
export const analyticsApi = {
  overview: (range = '7d') => api.get(`/analytics/overview?range=${range}`),
  focusTrends: (range = '7d') => api.get(`/analytics/focus-trends?range=${range}`),
  topDistracting: (range = '7d') => api.get(`/analytics/top-distracting?range=${range}`),
  sessionReport: (id) => api.get(`/analytics/session/${id}/report`),
};

// Study Planner
export const plannerApi = {
  createPlan: (data) => api.post('/planner/plans', data),
  getActivePlan: () => api.get('/planner/plans/active'),
  listPlans: () => api.get('/planner/plans'),
  updateTaskStatus: (taskId, status, linkedSessionId = null) =>
    api.patch(`/planner/tasks/${taskId}/status`, { status, linked_session_id: linkedSessionId }),
  rescheduleTask: (taskId, scheduledDate) =>
    api.patch(`/planner/tasks/${taskId}/reschedule`, { scheduled_date: scheduledDate }),
  deletePlan: (planId) => api.delete(`/planner/plans/${planId}`),
  getRecommendations: () => api.get('/planner/recommendations'),
  analyzeBehavior: () => api.post('/planner/recommendations/analyze'),
  applyRecommendation: (recId) => api.post(`/planner/recommendations/${recId}/apply`),
  dismissRecommendation: (recId) => api.post(`/planner/recommendations/${recId}/dismiss`),
  sendAgentCommand: (command) => api.post('/planner/agent/command', { command }),
  confirmAgentAction: (intent, params = {}) => api.post('/planner/agent/confirm', { intent, params }),
};

export default api;