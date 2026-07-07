import { api } from './api';

const unwrap = (response) => response.data;

export const taskService = {
  listTasks: (params) => api.get('/tasks', { params }).then(unwrap),
  createTask: (payload) => api.post('/tasks', payload).then(unwrap),
  updateTask: (id, payload) => api.patch(`/tasks/${id}`, payload).then(unwrap),
  deleteTask: (id) => api.delete(`/tasks/${id}`).then(unwrap)
};
