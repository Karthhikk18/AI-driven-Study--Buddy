import axios from 'axios';

// In production (Vercel), VITE_API_URL points to Railway backend.
// In dev, the Vite proxy forwards /api to localhost:8000.
const API_BASE_URL = '/api/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: false,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sb_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authApi = {
  register: (data: any) => api.post('/auth/register', data),
  login: (data: any) => api.post('/auth/login', { email: data.email, password: data.password }),
  getMe: () => api.get('/auth/me'),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  verifyOtp: (email: string, otp: string) => api.post('/auth/verify-otp', { email, otp }),
  resetPassword: (data: any) => api.post('/auth/reset-password', data),
};

export const documentApi = {
  getSubjects: () => api.get('/documents/subjects'),
  createSubject: (name: string) => api.post('/documents/subjects', { name }),
  uploadDocument: (subjectId: number, file: File) => {
    const formData = new FormData();
    formData.append('subject_id', (subjectId || 1).toString());
    formData.append('file', file);
    return api.post('/documents/upload', formData);
  },
  uploadLink: (subjectId: number, url: string) =>
    api.post('/documents/upload-link', { subject_id: subjectId, url }),
  listDocuments: (subjectId?: number) =>
    api.get('/documents/', { params: { subject_id: subjectId } }),
  deleteDocument: (id: number) => api.delete(`/documents/${id}`),
};

export const pageApi = {
  listPages: (subjectId?: number) => api.get('/pages/', { params: { subject_id: subjectId } }),
  createPage: (subjectId: number, title: string, icon: string = '📄') =>
    api.post('/pages/', { subject_id: subjectId, title, icon }),
  updatePage: (id: number, title: string, icon: string, blocks: any[]) =>
    api.put(`/pages/${id}`, { title, icon, blocks }),
  deletePage: (id: number) => api.delete(`/pages/${id}`),
};

export const todoApi = {
  listTasks: (subjectId?: number) => api.get('/todo/', { params: { subject_id: subjectId } }),
  createTask: (data: { subject_id: number; title: string; category?: string; priority?: string; due_date?: string }) =>
    api.post('/todo/', data),
  toggleTask: (id: number) => api.put(`/todo/${id}`, {}),
  deleteTask: (id: number) => api.delete(`/todo/${id}`),
};

export const chatApi = {
  sendQuery: (subjectId: number, query: string, mode: string) =>
    api.post('/chat/', { subject_id: subjectId, query, mode }),
};

export const quizApi = {
  generateQuiz: (subjectId: number, difficulty: string) =>
    api.post('/quiz/generate', { subject_id: subjectId, difficulty }),
  submitAnswers: (quizId: number, userAnswers: number[]) =>
    api.post('/quiz/submit', { quiz_id: quizId, user_answers: userAnswers }),
  generateFlashcards: (subjectId: number) =>
    api.post('/quiz/flashcards/generate', { subject_id: subjectId }),
  getFlashcards: (subjectId: number) => api.get(`/quiz/flashcards/${subjectId}`),
};

export const analyticsApi = {
  getDashboardAnalytics: () => api.get('/analytics/dashboard'),
};

export const exportApi = {
  exportPdf: (title: string, text: string) => api.post('/export/pdf', { title, text }),
  exportJpeg: (title: string, text: string) => api.post('/export/jpeg', { title, text }),
};

export const agentApi = {
  sendCommand: (command: string, subjectId: number, mode: string) =>
    api.post('/agent/command', { command, subject_id: subjectId, mode }),
};

export const mindmapApi = {
  generate: (subjectId: number) => api.post('/mindmap/generate', { subject_id: subjectId }),
  explain: (subjectId: number, concept: string) =>
    api.post('/mindmap/explain', { subject_id: subjectId, concept }),
};

export const subjectInsightsApi = {
  getInsights: (subjectId: number) => api.get(`/subjects/${subjectId}/insights`),
};

export const sessionApi = {
  logSession: (subjectId: number, sessionType: string = 'study') =>
    api.post('/sessions/log', { subject_id: subjectId, session_type: sessionType }),
  getHeatmap: () => api.get('/sessions/heatmap'),
};
