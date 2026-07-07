import { api } from './api';

const unwrap = (response) => response.data;

export const timelineService = {
  listPosts: (params) => api.get('/timeline', { params }).then(unwrap),
  createPost: (payload) => api.post('/timeline', payload).then(unwrap),
  deletePost: (id) => api.delete(`/timeline/${id}`).then(unwrap),
  togglePin: (id) => api.patch(`/timeline/${id}/pin`).then(unwrap)
};
