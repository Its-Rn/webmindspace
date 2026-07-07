import { api } from './api';

const unwrap = (response) => response.data;

export const dashboardService = {
  getDashboard: () => api.get('/dashboard').then(unwrap)
};
