import { api } from './api';
import { getSocket, disconnectSocket } from './socket';

export const chatApi = {
  getConversations: () => api.get('/chat/conversations'),
  getOrCreateConversation: (userId) => api.get(`/chat/conversations/${userId}`),
  createGroupConversation: (payload) => api.post('/chat/groups', payload),
  getUsers: (params = {}) => api.get('/chat/users', { params }),
  getMessages: (conversationId, params = {}) =>
    api.get(`/chat/conversations/${conversationId}/messages`, { params }),
  sendMessage: (conversationId, data) =>
    api.post(`/chat/conversations/${conversationId}/messages`, data),
  markAsRead: (conversationId) =>
    api.patch(`/chat/conversations/${conversationId}/read`),
  markAsDelivered: (conversationId) =>
    api.patch(`/chat/conversations/${conversationId}/delivered`),
  togglePinConversation: (conversationId) =>
    api.patch(`/chat/conversations/${conversationId}/pin`),
  deleteMessage: (messageId) =>
    api.delete(`/chat/messages/${messageId}`),
  unsendMessage: (messageId) =>
    api.delete(`/chat/messages/${messageId}/unsend`),
  searchUsers: (q) => api.get('/chat/search/users', { params: { q } }),
  getMyContactPermission: () => api.get('/chat/permissions/me'),
  updateMyContactPermission: (payload) => api.put('/chat/permissions/me', payload),
  getMyPrivacySetting: () => api.get('/chat/privacy/me'),
  updateMyPrivacySetting: (payload) => api.put('/chat/privacy/me', payload),
  getBlockedUsers: () => api.get('/chat/blocks'),
  blockUser: (payload) => api.post('/chat/blocks', payload),
  unblockUser: (userId) => api.delete(`/chat/blocks/${userId}`),
  getContactRequests: () => api.get('/chat/contact-requests'),
  createContactRequest: (payload) => api.post('/chat/contact-requests', payload),
  respondToContactRequest: (requestId, payload) => api.patch(`/chat/contact-requests/${requestId}`, payload),
  toggleFavoriteUser: (userId) => api.patch(`/chat/favorites/${userId}`),
  getChatPolicy: () => api.get('/chat/policy'),
  updateChatPolicy: (payload) => api.put('/chat/policy', payload)
};

export { getSocket, disconnectSocket };
