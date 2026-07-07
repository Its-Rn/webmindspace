import { api } from './api';

export const noteApi = {
  getNotes: (params = {}) => api.get('/notes', { params }),
  getNote: (noteId) => api.get(`/notes/${noteId}`),
  createNote: (data) => api.post('/notes', data),
  updateNote: (noteId, data) => api.patch(`/notes/${noteId}`, data),
  deleteNote: (noteId) => api.delete(`/notes/${noteId}`),
  getTags: () => api.get('/notes/tags')
};
