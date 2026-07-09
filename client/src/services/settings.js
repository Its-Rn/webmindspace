import { api } from './api';

const unwrap = (response) => response.data;

export const settingsService = {
  getSettings: () => api.get('/public/settings').then(unwrap),
  getSettingsBrief: () => api.get('/public/settings/brief').then(unwrap),
  updateSettings: (payload) => api.patch('/admin/settings', payload).then(unwrap)
};
