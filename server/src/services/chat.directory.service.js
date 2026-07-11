import Conversation from '../models/Conversation.js';
import User from '../models/User.js';
import { getChatPolicy, canSeeVisibility, isUserOnline } from './chat.policy.service.js';
import { getFavoriteIds, getContactsIds } from './chat.settings.service.js';

const ACTIVE_WINDOW_MS = 2 * 60 * 1000;

const getConversationForUsers = (conversations, currentUserId, otherUserId) => {
  const currentId = currentUserId.toString();
  return conversations.find((conversation) => {
    if (conversation.isGroup) return false;
    const participantIds = conversation.participants?.map((participant) => participant._id?.toString?.() || participant.toString()) || [];
    return participantIds.includes(currentId) && participantIds.includes(otherUserId.toString());
  });
};

const getMutualGroupsCount = (conversations, currentUserId, otherUserId) => {
  const currentId = currentUserId.toString();
  return conversations.filter((conversation) => {
    if (!conversation.isGroup) return false;
    const participantIds = conversation.participants?.map((participant) => participant._id?.toString?.() || participant.toString()) || [];
    return participantIds.includes(currentId) && participantIds.includes(otherUserId.toString());
  }).length;
};

export const getChatDirectory = async (currentUser, { q = '', filter = 'all' } = {}) => {
  const currentUserId = currentUser._id.toString();
  const search = String(q || '').trim();
  const normalizedFilter = String(filter || 'all').toLowerCase();
  const conversations = await Conversation.find({ participants: currentUserId })
    .populate('participants', 'name username email avatarUrl role isEmailVerified lastActiveAt chatEnabled')
    .sort({ 'lastMessage.sentAt': -1, updatedAt: -1 })
    .lean();

  const favoriteIds = new Set(await getFavoriteIds(currentUserId));
  const contactIds = new Set(await getContactsIds(currentUserId));
  const chatPolicy = await getChatPolicy();

  const baseQuery = {
    _id: { $ne: currentUser._id }
  };

  if (search) {
    baseQuery.$or = [
      { name: { $regex: search, $options: 'i' } },
      { username: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { role: { $regex: search, $options: 'i' } }
    ];
  }

  if (normalizedFilter === 'admins') {
    baseQuery.role = 'admin';
  } else if (normalizedFilter === 'writers') {
    baseQuery.role = 'writer';
  } else if (normalizedFilter === 'users') {
    baseQuery.role = 'user';
  } else if (normalizedFilter === 'online') {
    baseQuery.lastActiveAt = { $gte: new Date(Date.now() - ACTIVE_WINDOW_MS) };
  } else if (normalizedFilter === 'favorites') {
    baseQuery._id = { $in: [...favoriteIds].map((id) => id) };
  } else if (normalizedFilter === 'contacts') {
    baseQuery._id = { $in: [...contactIds].map((id) => id) };
  } else if (normalizedFilter === 'recent') {
    const recentIds = conversations
      .filter((conversation) => !conversation.isGroup && conversation.lastMessage?.sentAt)
      .map((conversation) => {
        const other = conversation.participants.find((participant) => participant._id.toString() !== currentUserId);
        return other?._id?.toString?.() || null;
      })
      .filter(Boolean);
    baseQuery._id = recentIds.length ? { $in: recentIds } : { $in: [] };
  }

  const users = await User.find(baseQuery)
    .select('name username email avatarUrl role isEmailVerified lastActiveAt chatEnabled')
    .sort({ lastActiveAt: -1, createdAt: -1 })
    .limit(250)
    .lean();

  const results = [];

  for (const user of users) {
    const conversation = getConversationForUsers(conversations, currentUserId, user._id);
    const visibleOnline = await canSeeVisibility({ viewer: currentUser, owner: user, field: 'whoCanSeeOnlineStatus' });
    const visibleLastSeen = await canSeeVisibility({ viewer: currentUser, owner: user, field: 'whoCanSeeLastSeen' });
    const visiblePicture = await canSeeVisibility({ viewer: currentUser, owner: user, field: 'whoCanSeeProfilePicture' });

    results.push({
      ...user,
      username: user.username || user.email?.split('@')[0] || '',
      isFavorite: favoriteIds.has(user._id.toString()),
      isContact: contactIds.has(user._id.toString()),
      isOnline: visibleOnline && isUserOnline(user),
      lastSeenAt: visibleLastSeen ? user.lastActiveAt : null,
      avatarUrl: visiblePicture ? user.avatarUrl : '',
      lastMessagePreview: conversation?.lastMessage?.content || '',
      unreadCount: Number(conversation?.unreadCounts?.[currentUserId] || 0),
      mutualGroupsCount: getMutualGroupsCount(conversations, currentUserId, user._id),
      conversationId: conversation?._id?.toString?.() || null,
      canMessage: true,
      rolePolicy: chatPolicy.roleRules.find((rule) => rule.role === user.role) || null
    });
  }

  if (normalizedFilter === 'groups') {
    return results.filter((entry) => entry.mutualGroupsCount > 0);
  }

  return results;
};
