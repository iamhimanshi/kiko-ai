import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Add token to every request
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
  end: (id) => api.post(`/sessions/${id}/end`),
  getHistory: () => api.get('/sessions'),
};

// Documents
export const documentApi = {
  upload: (formData) => api.post('/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getDocuments: () => api.get('/documents'),
  delete: (id) => api.delete(`/documents/${id}`),
};

// Assistant
export const assistantApi = {
  chat: (data) => api.post('/assistant/chat', data),
  summarize: (data) => api.post('/assistant/summarize', data),
  flashcards: (data) => api.post('/assistant/flashcards', data),
  quiz: (data) => api.post('/assistant/quiz', data),
};

export default api;
