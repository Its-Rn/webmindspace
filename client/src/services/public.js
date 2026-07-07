import { api } from './api';

const unwrap = (response) => response.data;

export const publicService = {
  submitContactForm: (payload) => api.post('/public/contact', payload).then(unwrap)
};
