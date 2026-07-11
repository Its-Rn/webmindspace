import { api } from './api';

export const adminApi = {
  getDashboardStats: () => api.get('/admin/dashboard'),
  getUsers: (params = {}) => api.get('/admin/users', { params }),
  createUser: (data) => api.post('/admin/users', data),
  toggleUserActive: (userId) => api.patch(`/admin/users/${userId}/toggle-active`),
  toggleUserAdmin: (userId) => api.patch(`/admin/users/${userId}/toggle-admin`),
  blockUser: (userId) => api.patch(`/admin/users/${userId}/block`),
  unblockUser: (userId) => api.patch(`/admin/users/${userId}/unblock`),
  verifyUserEmail: (userId) => api.patch(`/admin/users/${userId}/verify-email`),
  suspendUserChat: (userId, data = {}) => api.patch(`/admin/users/${userId}/chat/suspend`, data),
  restoreUserChat: (userId) => api.patch(`/admin/users/${userId}/chat/restore`),
  deleteUser: (userId) => api.delete(`/admin/users/${userId}`)
};
