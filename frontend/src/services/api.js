import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth APIs
export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

// Session APIs
export const sessionApi = {
  create: (data) => api.post('/sessions', data),
  getActive: () => api.get('/sessions/active'),
  end: (id) => api.post(`/sessions/${id}/end`),
  getHistory: () => api.get('/sessions'),
};

// Document APIs
export const documentApi = {
  upload: (formData) => api.post('/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getDocuments: () => api.get('/documents'),
  delete: (id) => api.delete(`/documents/${id}`),
};

// Assistant APIs
export const assistantApi = {
  chat: (data) => api.post('/assistant/chat', data),
  summarize: (data) => api.post('/assistant/summarize', data),
  generateFlashcards: (data) => api.post('/assistant/flashcards', data),
  generateQuiz: (data) => api.post('/assistant/quiz', data),
};

export default api;
