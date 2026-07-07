import { api } from './api';

export const adminApi = {
  getDashboardStats: () => api.get('/admin/dashboard'),
  getUsers: (params = {}) => api.get('/admin/users', { params }),
  createUser: (data) => api.post('/admin/users', data),
  toggleUserActive: (userId) => api.patch(`/admin/users/${userId}/toggle-active`),
  toggleUserAdmin: (userId) => api.patch(`/admin/users/${userId}/toggle-admin`)
};
