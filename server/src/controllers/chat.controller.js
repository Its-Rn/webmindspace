import * as chatService from '../services/chat.service.js';
import Conversation from '../models/Conversation.js';
import { getPusher, triggerEvent } from '../config/pusher.js';

const broadcastMessage = async (conversationId, senderId, message) => {
  try {
    const conversation = await Conversation.findById(conversationId).lean();
    if (!conversation) return;

    triggerEvent(`private-conversation-${conversationId}`, 'chat:message', message);

    const otherParticipants = conversation.participants.filter(
      (p) => p.toString() !== senderId.toString()
    );
    for (const pid of otherParticipants) {
      triggerEvent(`private-user-${pid.toString()}`, 'chat:new', {
        conversationId,
        message
      });
    }
  } catch {
    // Pusher not configured — REST response still succeeds.
  }
};

export const getConversations = async (req, res, next) => {
  try {
    const conversations = await chatService.getConversations(req.user.id);
    res.json({ success: true, data: conversations });
  } catch (error) {
    next(error);
  }
};

export const getOrCreateConversation = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const conversation = await chatService.getOrCreateConversation(req.user.id, userId);
    res.json({ success: true, data: conversation });
  } catch (error) {
    next(error);
  }
};

export const getMessages = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const { limit, before } = req.query;
    const messages = await chatService.getMessages(conversationId, req.user.id, parseInt(limit) || 50, before);
    res.json({ success: true, data: messages });
  } catch (error) {
    next(error);
  }
};

export const sendMessage = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const { content, type, attachmentUrl } = req.body;
    const message = await chatService.sendMessage(conversationId, req.user.id, content, type, attachmentUrl);
    await broadcastMessage(conversationId, req.user.id, message);
    res.status(201).json({ success: true, data: message });
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const result = await chatService.markAsRead(conversationId, req.user.id);
    triggerEvent(`private-conversation-${conversationId}`, 'chat:read', {
      conversationId,
      userId: req.user.id
    });
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const markAsDelivered = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const result = await chatService.markAsDelivered(conversationId, req.user.id);
    triggerEvent(`private-conversation-${conversationId}`, 'chat:delivered', {
      conversationId,
      userId: req.user.id
    });
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const deleteMessage = async (req, res, next) => {
  try {
    const { messageId } = req.params;
    const result = await chatService.deleteMessage(messageId, req.user.id);
    triggerEvent(`private-conversation-${result.conversationId}`, 'chat:messageDeleted', {
      conversationId: result.conversationId,
      messageId: result.messageId
    });
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const searchUsers = async (req, res, next) => {
  try {
    const { q } = req.query;
    const users = await chatService.searchUsers(q, req.user.id);
    res.json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
};

export const unsendMessage = async (req, res, next) => {
  try {
    const { messageId } = req.params;
    const result = await chatService.unsendMessage(messageId, req.user.id);
    triggerEvent(`private-conversation-${result.conversationId}`, 'chat:messageUnsent', {
      conversationId: result.conversationId,
      messageId: result.messageId
    });
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const pusherAuth = async (req, res, next) => {
  try {
    const pusher = getPusher();
    if (!pusher) {
      return res.status(500).json({ success: false, message: 'Pusher not configured.' });
    }
    const { socket_id, channel_name } = req.body;
    if (!socket_id || !channel_name) {
      return res.status(400).json({ success: false, message: 'Missing socket_id or channel_name.' });
    }
    const auth = pusher.authorizeChannel(socket_id, channel_name, {
      user_id: req.user.id,
      user_info: { name: req.user.name }
    });
    res.send(auth);
  } catch (error) {
    next(error);
  }
};
