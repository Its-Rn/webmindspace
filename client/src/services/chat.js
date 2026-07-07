import { api } from './api';
import { getSocket, disconnectSocket } from './socket';

export const chatApi = {
  getConversations: () => api.get('/chat/conversations'),
  getOrCreateConversation: (userId) => api.get(`/chat/conversations/${userId}`),
  getMessages: (conversationId, params = {}) =>
    api.get(`/chat/conversations/${conversationId}/messages`, { params }),
  sendMessage: (conversationId, data) =>
    api.post(`/chat/conversations/${conversationId}/messages`, data),
  markAsRead: (conversationId) =>
    api.patch(`/chat/conversations/${conversationId}/read`),
  markAsDelivered: (conversationId) =>
    api.patch(`/chat/conversations/${conversationId}/delivered`),
  deleteMessage: (messageId) =>
    api.delete(`/chat/messages/${messageId}`),
  unsendMessage: (messageId) =>
    api.delete(`/chat/messages/${messageId}/unsend`),
  searchUsers: (q) => api.get('/chat/search/users', { params: { q } })
};

export { getSocket, disconnectSocket };
