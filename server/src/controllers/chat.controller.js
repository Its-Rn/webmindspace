import * as chatService from '../services/chat.service.js';
import * as chatSettingsService from '../services/chat.settings.service.js';
import * as chatDirectoryService from '../services/chat.directory.service.js';
import Conversation from '../models/Conversation.js';
import { getPusher } from '../config/pusher.js';
import { emitToRoom, emitToUser } from '../config/socket.js';

const broadcastMessage = async (conversationId, senderId, message) => {
  try {
    const conversation = await Conversation.findById(conversationId).lean();
    if (!conversation) return;

    emitToRoom(`private-conversation-${conversationId}`, 'chat:message', message);

    const otherParticipants = conversation.participants.filter(
      (p) => p.toString() !== senderId.toString()
    );
    for (const pid of otherParticipants) {
      emitToUser(pid.toString(), 'chat:new', {
        conversationId,
        message
      });
    }
  } catch {
    // Pusher not configured — REST response still succeeds.
  }
};

const broadcastConversationCreated = async (conversation) => {
  try {
    const participants = conversation.participants || [];
    for (const participant of participants) {
      const participantId = participant?._id || participant;
      emitToUser(participantId.toString(), 'chat:new', {
        conversationId: conversation._id.toString(),
        conversation
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

export const createGroupConversation = async (req, res, next) => {
  try {
    const { participantIds, name } = req.body;
    const conversation = await chatService.createGroupConversation(req.user.id, participantIds || [], name || '');
    await broadcastConversationCreated(conversation);
    res.status(201).json({ success: true, data: conversation });
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
    emitToRoom(`private-conversation-${conversationId}`, 'chat:read', {
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
    emitToRoom(`private-conversation-${conversationId}`, 'chat:delivered', {
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
    emitToRoom(`private-conversation-${result.conversationId}`, 'chat:messageDeleted', {
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
    emitToRoom(`private-conversation-${result.conversationId}`, 'chat:messageUnsent', {
      conversationId: result.conversationId,
      messageId: result.messageId
    });
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const togglePinConversation = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const result = await chatService.toggleConversationPin(conversationId, req.user.id);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const getChatDirectory = async (req, res, next) => {
  try {
    const { q = '', filter = 'all' } = req.query;
    const users = await chatDirectoryService.getChatDirectory(req.user, { q, filter });
    res.json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
};

export const getMyContactPermission = async (req, res, next) => {
  try {
    const data = await chatSettingsService.getMyContactPermission(req.user.id);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const updateMyContactPermission = async (req, res, next) => {
  try {
    const data = await chatSettingsService.updateMyContactPermission(req.user.id, req.body);
    res.json({ success: true, data, message: 'Contact permissions updated.' });
  } catch (error) {
    next(error);
  }
};

export const getMyPrivacySetting = async (req, res, next) => {
  try {
    const data = await chatSettingsService.getMyPrivacySetting(req.user.id);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const updateMyPrivacySetting = async (req, res, next) => {
  try {
    const data = await chatSettingsService.updateMyPrivacySetting(req.user.id, req.body);
    res.json({ success: true, data, message: 'Privacy settings updated.' });
  } catch (error) {
    next(error);
  }
};

export const getBlockedUsers = async (req, res, next) => {
  try {
    const data = await chatSettingsService.getBlockedUsersForMe(req.user.id);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const blockUser = async (req, res, next) => {
  try {
    const { userId, reason } = req.body;
    const data = await chatSettingsService.blockUser(req.user.id, userId, reason);
    res.json({ success: true, data, message: 'User blocked.' });
  } catch (error) {
    next(error);
  }
};

export const unblockUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const data = await chatSettingsService.unblockUser(req.user.id, userId);
    res.json({ success: true, data, message: 'User unblocked.' });
  } catch (error) {
    next(error);
  }
};

export const getContactRequests = async (req, res, next) => {
  try {
    const data = await chatSettingsService.getContactRequests(req.user.id);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const createContactRequest = async (req, res, next) => {
  try {
    const { recipientId, message } = req.body;
    const data = await chatSettingsService.createContactRequest(req.user.id, recipientId, message);
    emitToUser(recipientId, 'chat:contactRequest', data);
    res.status(201).json({ success: true, data, message: 'Contact request sent.' });
  } catch (error) {
    next(error);
  }
};

export const respondToContactRequest = async (req, res, next) => {
  try {
    const { requestId } = req.params;
    const { action } = req.body;
    const data = await chatSettingsService.respondToContactRequest(requestId, req.user.id, action);
    emitToUser(data.sender.toString(), 'chat:contactRequestUpdated', data);
    res.json({ success: true, data, message: 'Contact request updated.' });
  } catch (error) {
    next(error);
  }
};

export const getChatPolicy = async (req, res, next) => {
  try {
    const data = await chatSettingsService.getChatPolicySettings();
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const updateChatPolicy = async (req, res, next) => {
  try {
    const data = await chatSettingsService.updateChatPolicySettings(req.body);
    res.json({ success: true, data, message: 'Chat policy updated.' });
  } catch (error) {
    next(error);
  }
};

export const toggleFavoriteUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const data = await chatSettingsService.toggleFavoriteUser(req.user.id, userId);
    res.json({ success: true, data });
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
