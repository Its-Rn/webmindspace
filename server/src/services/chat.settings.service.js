import User from '../models/User.js';
import ContactPermission from '../models/ContactPermission.js';
import PrivacySetting from '../models/PrivacySetting.js';
import BlockedUser from '../models/BlockedUser.js';
import ContactRequest from '../models/ContactRequest.js';
import UserRelationship from '../models/UserRelationship.js';
import ChatPolicy from '../models/ChatPolicy.js';
import { AppError } from '../utils/appError.js';
import { getChatPolicy, saveChatPolicy, getContactPermission, upsertContactPermission, getPrivacySetting, upsertPrivacySetting, listBlockedUsers, blockUser as blockUserRecord, unblockUser as unblockUserRecord } from './chat.policy.service.js';

export const getMyContactPermission = async (userId) => {
  return getContactPermission(userId);
};

export const updateMyContactPermission = async (userId, payload) => {
  return upsertContactPermission(userId, payload);
};

export const getMyPrivacySetting = async (userId) => {
  return getPrivacySetting(userId);
};

export const updateMyPrivacySetting = async (userId, payload) => {
  return upsertPrivacySetting(userId, payload);
};

export const getBlockedUsersForMe = async (userId) => {
  return listBlockedUsers(userId);
};

export const blockUser = async (blockerId, targetUserId, reason = '', blockedByAdmin = false) => {
  const targetUser = await User.findById(targetUserId).select('_id').lean();
  if (!targetUser) {
    throw new AppError('User not found.', 404);
  }
  return blockUserRecord(blockerId, targetUserId, reason, blockedByAdmin);
};

export const unblockUser = async (blockerId, targetUserId) => {
  return unblockUserRecord(blockerId, targetUserId);
};

export const getContactRequests = async (userId) => {
  return ContactRequest.find({
    $or: [{ sender: userId }, { recipient: userId }]
  })
    .populate('sender', 'name username avatarUrl role')
    .populate('recipient', 'name username avatarUrl role')
    .sort({ createdAt: -1 })
    .lean();
};

export const createContactRequest = async (senderId, recipientId, message = '') => {
  if (String(senderId) === String(recipientId)) {
    throw new AppError('You cannot contact yourself.', 400);
  }

  const existing = await ContactRequest.findOne({
    sender: senderId,
    recipient: recipientId,
    status: 'pending'
  }).lean();

  if (existing) {
    return existing;
  }

  const request = await ContactRequest.create({
    sender: senderId,
    recipient: recipientId,
    message
  });

  return request.toObject();
};

export const respondToContactRequest = async (requestId, currentUserId, action) => {
  const contactRequest = await ContactRequest.findById(requestId);
  if (!contactRequest) {
    throw new AppError('Contact request not found.', 404);
  }

  if (contactRequest.recipient.toString() !== currentUserId.toString()) {
    throw new AppError('You cannot respond to this request.', 403);
  }

  if (!['accepted', 'rejected', 'blocked'].includes(action)) {
    throw new AppError('Invalid contact request action.', 400);
  }

  contactRequest.status = action;
  contactRequest.respondedAt = new Date();
  contactRequest.respondedBy = currentUserId;
  await contactRequest.save();

  if (action === 'accepted') {
    await UserRelationship.findOneAndUpdate(
      { user: contactRequest.sender, relatedUser: contactRequest.recipient, type: 'contact' },
      { $set: { status: 'active' } },
      { upsert: true, new: true }
    );
    await UserRelationship.findOneAndUpdate(
      { user: contactRequest.recipient, relatedUser: contactRequest.sender, type: 'contact' },
      { $set: { status: 'active' } },
      { upsert: true, new: true }
    );
  }

  if (action === 'blocked') {
    await blockUserRecord(contactRequest.recipient, contactRequest.sender, 'Blocked from contact request');
  }

  return contactRequest.toObject();
};

export const toggleFavoriteUser = async (userId, relatedUserId) => {
  const existing = await UserRelationship.findOne({
    user: userId,
    relatedUser: relatedUserId,
    type: 'favorite'
  }).lean();

  if (existing) {
    await UserRelationship.deleteOne({ _id: existing._id });
    return { favorited: false };
  }

  await UserRelationship.create({
    user: userId,
    relatedUser: relatedUserId,
    type: 'favorite',
    status: 'active'
  });

  return { favorited: true };
};

export const getFavoriteIds = async (userId) => {
  const favorites = await UserRelationship.find({
    user: userId,
    type: 'favorite',
    status: 'active'
  })
    .select('relatedUser')
    .lean();

  return favorites.map((favorite) => favorite.relatedUser.toString());
};

export const getFollowersIds = async (userId) => {
  const follows = await UserRelationship.find({
    relatedUser: userId,
    type: 'follow',
    status: 'active'
  })
    .select('user')
    .lean();
  return follows.map((follow) => follow.user.toString());
};

export const getContactsIds = async (userId) => {
  const contacts = await UserRelationship.find({
    user: userId,
    type: 'contact',
    status: 'active'
  })
    .select('relatedUser')
    .lean();
  return contacts.map((contact) => contact.relatedUser.toString());
};

export const getChatPolicySettings = async () => {
  return getChatPolicy();
};

export const updateChatPolicySettings = async (payload) => {
  return saveChatPolicy(payload);
};

export const getBlockedIds = async (userId) => {
  const blocked = await BlockedUser.find({ blocker: userId }).select('blockedUser').lean();
  return blocked.map((row) => row.blockedUser.toString());
};

