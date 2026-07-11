import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import * as notificationService from './notification.service.js';
import { canDirectMessage, canCreateGroup, canAddToGroup, getChatPolicy } from './chat.policy.service.js';

const ensureConversationMember = (conversation, userId) => {
  if (!conversation?.participants?.some((participant) => participant.toString() === userId.toString())) {
    throw Object.assign(new Error('Not a participant'), { statusCode: 403 });
  }
};

export const getConversations = async (userId) => {
  return Conversation.find({ participants: userId })
    .populate('participants', 'name username avatarUrl title lastActiveAt role isEmailVerified chatEnabled')
    .sort({ 'lastMessage.sentAt': -1, updatedAt: -1 })
    .lean();
};

export const getOrCreateConversation = async (currentUserId, otherUserId) => {
  if (currentUserId.toString() === otherUserId.toString()) {
    throw Object.assign(new Error('You cannot start a conversation with yourself.'), { statusCode: 400 });
  }

  const sender = await User.findById(currentUserId).select('name role isActive chatEnabled lastActiveAt').lean();
  const recipient = await User.findById(otherUserId).select('name role isActive chatEnabled lastActiveAt').lean();

  const decision = await canDirectMessage({ sender, recipient });
  if (!decision.allowed) {
    const error = new Error(decision.reason || 'You cannot message this user.');
    error.statusCode = 403;
    error.requiresContactRequest = Boolean(decision.requiresContactRequest);
    throw error;
  }

  if (currentUserId === otherUserId) {
    const existing = await Conversation.findOne({
      participants: [currentUserId],
      isGroup: false
    }).populate('participants', 'name username avatarUrl title lastActiveAt role isEmailVerified chatEnabled').lean();
    if (existing) return existing;

    const conversation = await Conversation.create({
      participants: [currentUserId],
      isGroup: false
    });
    return Conversation.findById(conversation._id)
      .populate('participants', 'name username avatarUrl title lastActiveAt role isEmailVerified chatEnabled')
      .lean();
  }

  const existing = await Conversation.findOne({
    participants: { $all: [currentUserId, otherUserId], $size: 2 },
    isGroup: false
  }).populate('participants', 'name username avatarUrl title lastActiveAt role isEmailVerified chatEnabled').lean();

  if (existing) return existing;

  const conversation = await Conversation.create({
    participants: [currentUserId, otherUserId],
    isGroup: false
  });
  return Conversation.findById(conversation._id)
    .populate('participants', 'name username avatarUrl title lastActiveAt role isEmailVerified chatEnabled')
    .lean();
};

export const createGroupConversation = async (currentUserId, participantIds = [], name = '') => {
  const creator = await User.findById(currentUserId).select('role isActive chatEnabled').lean();
  const policy = await getChatPolicy();
  const createDecision = await canCreateGroup({ creator, policy });
  if (!createDecision.allowed) {
    const error = new Error(createDecision.reason || 'You cannot create group chats.');
    error.statusCode = 403;
    throw error;
  }

  const uniqueParticipantIds = [...new Set([currentUserId.toString(), ...participantIds.map((id) => id.toString())])];
  if (uniqueParticipantIds.length < 3) {
    throw Object.assign(new Error('A group needs at least 3 participants.'), { statusCode: 400 });
  }

  const users = await User.find({ _id: { $in: uniqueParticipantIds } }).select('_id isActive isEmailVerified').lean();
  if (users.length !== uniqueParticipantIds.length) {
    throw Object.assign(new Error('One or more participants were not found.'), { statusCode: 404 });
  }

  const activeVerifiedUsers = users.filter((user) => user.isActive && user.isEmailVerified);
  if (activeVerifiedUsers.length !== users.length) {
    throw Object.assign(new Error('All participants must be active and verified.'), { statusCode: 400 });
  }

  const participantMap = new Map(users.map((user) => [user._id.toString(), user]));
  for (const participantId of uniqueParticipantIds) {
    if (participantId.toString() === currentUserId.toString()) continue;
    const participant = participantMap.get(participantId.toString());
    const decision = await canAddToGroup({ owner: creator, member: participant, policy });
    if (!decision.allowed) {
      throw Object.assign(new Error(decision.reason || 'You cannot add one of the selected users to this group.'), { statusCode: 403 });
    }
  }

  const conversation = await Conversation.create({
    participants: uniqueParticipantIds,
    isGroup: true,
    name: String(name || '').trim().slice(0, 100)
  });

  return Conversation.findById(conversation._id)
    .populate('participants', 'name username avatarUrl title lastActiveAt role isEmailVerified chatEnabled')
    .lean();
};

export const toggleConversationPin = async (conversationId, userId) => {
  const conversation = await Conversation.findOne({ _id: conversationId, participants: userId });
  if (!conversation) {
    throw Object.assign(new Error('Conversation not found'), { statusCode: 404 });
  }

  const alreadyPinned = conversation.pinnedBy?.some((id) => id.toString() === userId.toString());
  if (alreadyPinned) {
    conversation.pinnedBy = conversation.pinnedBy.filter((id) => id.toString() !== userId.toString());
  } else {
    conversation.pinnedBy = [...(conversation.pinnedBy || []), userId];
  }

  await conversation.save();

  return {
    isPinned: !alreadyPinned
  };
};

export const getMessages = async (conversationId, userId, limit = 50, before = null) => {
  const conversation = await Conversation.findById(conversationId).select('participants').lean();
  if (!conversation) {
    throw Object.assign(new Error('Conversation not found'), { statusCode: 404 });
  }
  ensureConversationMember(conversation, userId);

  const filter = { conversation: conversationId, deletedAt: null };
  if (before) {
    filter.createdAt = { $lt: new Date(before) };
  }

  const messages = await Message.find(filter)
    .populate('sender', 'name username avatarUrl role isEmailVerified')
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

  const sender = await User.findById(senderId).select('name role isActive chatEnabled lastActiveAt').lean();
  if (!sender || !sender.isActive || sender.chatEnabled === false) {
    throw Object.assign(new Error('Your account cannot send messages right now.'), { statusCode: 403 });
  }

  if (!conversation.participants.some((p) => p.toString() === senderId)) {
    throw Object.assign(new Error('Not a participant'), { statusCode: 403 });
  }

  if (!conversation.isGroup) {
    const recipientId = conversation.participants.find((participantId) => participantId.toString() !== senderId.toString());
    const recipient = await User.findById(recipientId).select('name role isActive chatEnabled lastActiveAt').lean();
    const decision = await canDirectMessage({ sender, recipient });
    if (!decision.allowed) {
      throw Object.assign(new Error(decision.reason || 'You cannot send messages to this user.'), {
        statusCode: 403,
        requiresContactRequest: Boolean(decision.requiresContactRequest)
      });
    }
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
      message._id,
      {
        senderName: sender?.name || '',
        contentTitle: 'New message',
        contentType: 'chat'
      }
    );
  }

  await conversation.save();

  await User.findByIdAndUpdate(senderId, { $inc: { 'stats.messagesSent': 1 } });

  const populated = await Message.findById(message._id)
    .populate('sender', 'name username avatarUrl role isEmailVerified')
    .lean();

  return populated;
};

export const markAsRead = async (conversationId, userId) => {
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) {
    throw Object.assign(new Error('Conversation not found'), { statusCode: 404 });
  }
  ensureConversationMember(conversation, userId);

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
  ensureConversationMember(conversation, userId);
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
      { username: { $regex: query, $options: 'i' } },
      { email: { $regex: query, $options: 'i' } }
    ]
  })
    .select('name username avatarUrl email title lastActiveAt role isEmailVerified')
    .limit(10)
    .lean();
};
