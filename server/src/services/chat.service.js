import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import * as notificationService from './notification.service.js';

export const getConversations = async (userId) => {
  return Conversation.find({ participants: userId })
    .populate('participants', 'name avatarUrl title')
    .sort({ 'lastMessage.sentAt': -1, updatedAt: -1 })
    .lean();
};

export const getOrCreateConversation = async (currentUserId, otherUserId) => {
  if (currentUserId === otherUserId) {
    const existing = await Conversation.findOne({
      participants: [currentUserId],
      isGroup: false
    }).populate('participants', 'name avatarUrl title').lean();
    if (existing) return existing;

    const conversation = await Conversation.create({
      participants: [currentUserId],
      isGroup: false
    });
    return Conversation.findById(conversation._id)
      .populate('participants', 'name avatarUrl title')
      .lean();
  }

  const existing = await Conversation.findOne({
    participants: { $all: [currentUserId, otherUserId], $size: 2 },
    isGroup: false
  }).populate('participants', 'name avatarUrl title').lean();

  if (existing) return existing;

  const conversation = await Conversation.create({
    participants: [currentUserId, otherUserId],
    isGroup: false
  });
  return Conversation.findById(conversation._id)
    .populate('participants', 'name avatarUrl title')
    .lean();
};

export const getMessages = async (conversationId, userId, limit = 50, before = null) => {
  const filter = { conversation: conversationId, deletedAt: null };
  if (before) {
    filter.createdAt = { $lt: new Date(before) };
  }

  const messages = await Message.find(filter)
    .populate('sender', 'name avatarUrl')
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  return messages.reverse();
};

export const sendMessage = async (conversationId, senderId, content, type = 'text', attachmentUrl = '') => {
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) {
    throw Object.assign(new Error('Conversation not found'), { statusCode: 404 });
  }

  if (!conversation.participants.some((p) => p.toString() === senderId)) {
    throw Object.assign(new Error('Not a participant'), { statusCode: 403 });
  }

  const message = await Message.create({
    conversation: conversationId,
    sender: senderId,
    content,
    type,
    attachmentUrl,
    deliveredTo: [senderId]
  });

  conversation.lastMessage = {
    content,
    sender: senderId,
    sentAt: message.createdAt
  };

  await conversation.save();

  const otherParticipants = conversation.participants.filter(
    (p) => p.toString() !== senderId
  );
  for (const pid of otherParticipants) {
    const key = pid.toString();
    conversation.unreadCounts.set(key, (conversation.unreadCounts.get(key) || 0) + 1);

    const sender = await User.findById(senderId).select('name').lean();
    notificationService.createNotification(
      pid,
      'chat',
      `New message from ${sender?.name || 'Someone'}`,
      content.length > 100 ? content.slice(0, 100) + '...' : content,
      '/chat',
      message._id
    );
  }

  await conversation.save();

  await User.findByIdAndUpdate(senderId, { $inc: { 'stats.messagesSent': 1 } });

  const populated = await Message.findById(message._id)
    .populate('sender', 'name avatarUrl')
    .lean();

  return populated;
};

export const markAsRead = async (conversationId, userId) => {
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) {
    throw Object.assign(new Error('Conversation not found'), { statusCode: 404 });
  }

  conversation.unreadCounts.set(userId, 0);
  await conversation.save();

  await Message.updateMany(
    { conversation: conversationId, sender: { $ne: userId }, readBy: { $ne: userId } },
    { $addToSet: { readBy: userId, deliveredTo: userId } }
  );

  return { success: true };
};

export const deleteMessage = async (messageId, userId) => {
  const message = await Message.findById(messageId);
  if (!message) {
    throw Object.assign(new Error('Message not found'), { statusCode: 404 });
  }
  if (message.sender.toString() !== userId) {
    throw Object.assign(new Error('Not authorized'), { statusCode: 403 });
  }
  message.deletedAt = new Date();
  await message.save();
  return { success: true, conversationId: message.conversation.toString(), messageId: message._id.toString() };
};

export const unsendMessage = async (messageId, userId) => {
  const message = await Message.findById(messageId);
  if (!message) {
    throw Object.assign(new Error('Message not found'), { statusCode: 404 });
  }
  if (message.sender.toString() !== userId) {
    throw Object.assign(new Error('Not authorized'), { statusCode: 403 });
  }
  const conversationId = message.conversation.toString();
  await Message.findByIdAndDelete(messageId);
  return { success: true, conversationId, messageId: message._id.toString() };
};

export const markAsDelivered = async (conversationId, userId) => {
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) {
    throw Object.assign(new Error('Conversation not found'), { statusCode: 404 });
  }
  await Message.updateMany(
    { conversation: conversationId, deliveredTo: { $ne: userId } },
    { $addToSet: { deliveredTo: userId } }
  );
  return { success: true };
};

export const searchUsers = async (query, excludeUserId) => {
  if (!query || query.length < 2) return [];
  return User.find({
    _id: { $ne: excludeUserId },
    $or: [
      { name: { $regex: query, $options: 'i' } },
      { email: { $regex: query, $options: 'i' } }
    ]
  })
    .select('name avatarUrl email title')
    .limit(10)
    .lean();
};
