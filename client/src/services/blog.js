import { api } from './api';

const unwrap = (response) => response.data;

export const blogService = {
  listPosts: (params) => api.get('/blog', { params }).then(unwrap),
  getPost: (slugOrId) => api.get(`/blog/${slugOrId}`).then(unwrap),
  createPost: (payload) => api.post('/blog', payload).then(unwrap),
  updatePost: (id, payload) => api.patch(`/blog/${id}`, payload).then(unwrap),
  deletePost: (id) => api.delete(`/blog/${id}`).then(unwrap)
};
