import { api } from './api';

const unwrap = (response) => response.data;

export const userService = {
  getMyProfile: () => api.get('/users/me').then(unwrap),
  updateMyProfile: (payload) => api.patch('/users/me', payload).then(unwrap),
  updateMyAvatar: (file) => {
    const formData = new FormData();
    formData.append('avatar', file);

    return api.post('/users/me/avatar', formData).then(unwrap);
  }
};

