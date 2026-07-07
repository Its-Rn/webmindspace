import { api } from './api';

const unwrap = (response) => response.data;

export const settingsService = {
  getSettings: () => api.get('/public/settings').then(unwrap),
  updateSettings: (payload) => api.patch('/admin/settings', payload).then(unwrap)
};
