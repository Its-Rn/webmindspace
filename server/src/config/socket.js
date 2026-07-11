import { Server } from 'socket.io';
import User from '../models/User.js';
import Conversation from '../models/Conversation.js';
import { verifyAccessToken } from '../services/token.service.js';

let ioInstance = null;

const readTokenFromCookieHeader = (cookieHeader = '') => {
  const tokens = cookieHeader.split(';').map((segment) => segment.trim());
  for (const token of tokens) {
    const [name, ...valueParts] = token.split('=');
    if (!name) continue;
    if (name === 'accessToken' || name === 'ppp_access_token') {
      return decodeURIComponent(valueParts.join('='));
    }
  }
  return null;
};

const getTokenFromHandshake = (socket) => {
  const authToken = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace(/^Bearer\s+/i, '');
  if (authToken) return authToken;
  return readTokenFromCookieHeader(socket.handshake.headers?.cookie || '');
};

const canJoinConversation = async (userId, conversationId) => {
  const conversation = await Conversation.findById(conversationId).select('participants isGroup').lean();
  if (!conversation) return false;
  return conversation.participants.some((participant) => participant.toString() === userId.toString());
};

export const initSocketServer = (httpServer, corsOrigin = true) => {
  if (ioInstance) return ioInstance;

  ioInstance = new Server(httpServer, {
    cors: {
      origin: corsOrigin,
      credentials: true
    }
  });

  ioInstance.use(async (socket, next) => {
    try {
      const token = getTokenFromHandshake(socket);
      if (!token) {
        return next(new Error('Authentication required.'));
      }

      const payload = verifyAccessToken(token);
      const user = await User.findById(payload.sub).select('_id name email role isActive chatEnabled lastActiveAt').lean();
      if (!user || !user.isActive) {
        return next(new Error('Account not found or disabled.'));
      }

      socket.user = {
        id: user._id.toString(),
        name: user.name,
        role: user.role
      };

      return next();
    } catch (error) {
      return next(new Error('Authentication failed.'));
    }
  });

  ioInstance.on('connection', (socket) => {
    const { id: userId } = socket.user || {};
    if (userId) {
      socket.join(`private-user-${userId}`);
    }

    socket.on('subscribe', async ({ channelName }) => {
      if (!channelName || typeof channelName !== 'string') return;
      if (channelName === `private-user-${userId}`) {
        socket.join(channelName);
        return;
      }

      const conversationMatch = channelName.match(/^private-conversation-(.+)$/);
      if (conversationMatch) {
        const conversationId = conversationMatch[1];
        const allowed = await canJoinConversation(userId, conversationId);
        if (allowed) {
          socket.join(channelName);
        }
      }
    });

    socket.on('unsubscribe', ({ channelName }) => {
      if (!channelName || typeof channelName !== 'string') return;
      socket.leave(channelName);
    });

    socket.on('client-event', ({ channelName, eventName, payload }) => {
      if (!channelName || !eventName) return;
      socket.to(channelName).emit(eventName, payload);
    });

    socket.on('typing', ({ conversationId, isTyping, userId: typingUserId }) => {
      if (!conversationId) return;
      const channelName = `private-conversation-${conversationId}`;
      socket.to(channelName).emit('chat:typing', {
        conversationId,
        userId: typingUserId || userId,
        isTyping: Boolean(isTyping)
      });
    });
  });

  return ioInstance;
};

export const getSocketServer = () => ioInstance;

export const emitToRoom = (roomName, eventName, payload) => {
  if (!ioInstance) return;
  ioInstance.to(roomName).emit(eventName, payload);
};

export const emitToUser = (userId, eventName, payload) => {
  emitToRoom(`private-user-${userId}`, eventName, payload);
};

