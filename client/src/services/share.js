import { api } from './api';

const unwrap = (response) => response.data;

export const shareService = {
  getUsers: () => api.get('/share/users').then(unwrap),
  createShare: (targetUserId, contentType) => api.post('/share/create', { targetUserId, contentType }).then(unwrap),
  createShares: (targetUserId, contentTypes) => api.post('/share/create-batch', { targetUserId, contentTypes }).then(unwrap),
  stopShare: (targetUserId, contentType) => api.post('/share/stop', { targetUserId, contentType }).then(unwrap),
  getOutgoingShares: () => api.get('/share/outgoing').then(unwrap),
  getIncomingShares: () => api.get('/share/incoming').then(unwrap),
  viewSharedData: (ownerId, contentType) => api.get(`/share/view/${ownerId}/${contentType}`).then(unwrap)
};
