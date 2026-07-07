import { api } from './api';

const unwrap = (response) => response.data;

export const authService = {
  register: (payload) => api.post('/auth/register', payload).then(unwrap),
  login: (payload) => api.post('/auth/login', payload).then(unwrap),
  me: () => api.get('/auth/me').then(unwrap),
  logout: () => api.post('/auth/logout').then(unwrap),
  refresh: () => api.post('/auth/refresh').then(unwrap),
  verifyEmail: (payload) => api.post('/auth/verify-email', payload).then(unwrap),
  resendVerification: (payload) => api.post('/auth/resend-verification', payload).then(unwrap),
  forgotPassword: (payload) => api.post('/auth/forgot-password', payload).then(unwrap),
  resetPassword: (payload) => api.post('/auth/reset-password', payload).then(unwrap),
  changePassword: (payload) => api.patch('/auth/change-password', payload).then(unwrap)
};

