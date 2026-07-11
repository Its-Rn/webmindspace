import User from '../models/User.js';
import Session from '../models/Session.js';
import SharedContent from '../models/SharedContent.js';
import Post from '../models/Post.js';
import TimelinePost from '../models/TimelinePost.js';
import Task from '../models/Task.js';
import Note from '../models/Note.js';
import Message from '../models/Message.js';
import Conversation from '../models/Conversation.js';
import Notification from '../models/Notification.js';
import ContactPermission from '../models/ContactPermission.js';
import PrivacySetting from '../models/PrivacySetting.js';
import BlockedUser from '../models/BlockedUser.js';
import ContactRequest from '../models/ContactRequest.js';
import UserRelationship from '../models/UserRelationship.js';
import { deleteStoredAvatar } from './media.service.js';
import { AppError } from '../utils/appError.js';

export const getDashboardStats = async () => {
  const [
    totalUsers,
    activeUsers,
    pendingApprovals,
    totalPosts,
    totalTimelinePosts,
    totalTasks,
    totalNotes,
    totalMessages,
    totalConversations,
    totalNotifications
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ isActive: true, lastActiveAt: { $gte: new Date(Date.now() - 7 * 86400000) } }),
    User.countDocuments({ $or: [{ isActive: false }, { isEmailVerified: false }] }),
    Post.countDocuments(),
    TimelinePost.countDocuments({ isDeleted: false }),
    Task.countDocuments(),
    Note.countDocuments({ isDeleted: false }),
    Message.countDocuments({ deletedAt: null }),
    Conversation.countDocuments(),
    Notification.countDocuments()
  ]);

  const recentUsers = await User.find()
    .sort({ createdAt: -1 })
    .limit(5)
    .select('name email role isActive isEmailVerified createdAt')
    .lean();

  const totalStats = await User.aggregate([
    {
      $group: {
        _id: null,
        totalTasksCompleted: { $sum: '$stats.tasksCompleted' },
        totalBlogsPublished: { $sum: '$stats.blogsPublished' },
        totalNotesCreated: { $sum: '$stats.notesCreated' },
        totalTimelinePosts: { $sum: '$stats.timelinePosts' },
        totalMessagesSent: { $sum: '$stats.messagesSent' }
      }
    }
  ]);

  return {
    counts: {
      users: totalUsers,
      activeUsers,
      pendingApprovals,
      posts: totalPosts,
      timelinePosts: totalTimelinePosts,
      tasks: totalTasks,
      notes: totalNotes,
      messages: totalMessages,
      conversations: totalConversations,
      notifications: totalNotifications
    },
    totals: totalStats[0] || {
      totalTasksCompleted: 0,
      totalBlogsPublished: 0,
      totalNotesCreated: 0,
      totalTimelinePosts: 0,
      totalMessagesSent: 0
    },
    recentUsers
  };
};

export const getUsers = async (page = 1, limit = 20, search = '') => {
  const filter = {};
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }

  const skip = (page - 1) * limit;
  const [users, total] = await Promise.all([
    User.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-passwordHash -passwordResetTokenHash -passwordResetExpiresAt -emailVerificationTokenHash -emailVerificationExpiresAt')
      .lean(),
    User.countDocuments(filter)
  ]);

  return {
    users,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

const buildUsername = (name, email) => {
  const base = String(name || email?.split('@')[0] || 'user')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '')
    .slice(0, 24) || 'user';
  return base;
};

const ensureUniqueUsername = async (preferredUsername) => {
  const normalized = preferredUsername.toLowerCase();
  const existing = await User.findOne({ username: normalized }).select('_id').lean();
  if (!existing) return normalized;

  for (let suffix = 2; suffix < 1000; suffix += 1) {
    const candidate = `${normalized}.${suffix}`;
    // eslint-disable-next-line no-await-in-loop
    const candidateExists = await User.findOne({ username: candidate }).select('_id').lean();
    if (!candidateExists) return candidate;
  }

  return `${normalized}.${Date.now().toString(36)}`;
};

export const createUser = async ({ name, email, password, role, isEmailVerified, isActive }) => {
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError('A user with this email already exists.', 409);
  }

  const username = await ensureUniqueUsername(buildUsername(name, email));
  const userData = {
    name,
    email,
    username,
    passwordHash: password,
    role,
    isActive,
    chatEnabled: true
  };

  if (isEmailVerified) {
    userData.isEmailVerified = true;
    userData.emailVerifiedAt = new Date();
  }

  const user = await User.create(userData);

  return user.toProfileJSON();
};

export const toggleUserActive = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found.', 404);
  }
  user.isActive = !user.isActive;
  await user.save();
  return user.toProfileJSON();
};

export const suspendUserChat = async (userId, { reason = '' } = {}) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found.', 404);
  }

  user.chatEnabled = false;
  user.chatSuspendedAt = new Date();
  user.chatSuspensionReason = String(reason || '').trim().slice(0, 250);
  await user.save();

  return user.toProfileJSON();
};

export const restoreUserChat = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found.', 404);
  }

  user.chatEnabled = true;
  user.chatSuspendedAt = null;
  user.chatSuspensionReason = '';
  await user.save();

  return user.toProfileJSON();
};

export const toggleUserAdmin = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found.', 404);
  }
  user.role = user.role === 'admin' ? 'user' : 'admin';
  await user.save();
  return user.toProfileJSON();
};

export const blockUser = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found.', 404);
  }

  user.isActive = false;
  await user.save();

  return user.toProfileJSON();
};

export const unblockUser = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found.', 404);
  }

  user.isActive = true;
  await user.save();

  return user.toProfileJSON();
};

export const verifyUserEmail = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found.', 404);
  }

  user.isActive = true;
  user.isEmailVerified = true;
  user.emailVerifiedAt = new Date();
  user.emailVerificationTokenHash = null;
  user.emailVerificationExpiresAt = null;
  await user.save({ validateModifiedOnly: true });

  return user.toProfileJSON();
};

const cleanupConversationParticipants = async (userId) => {
  const conversations = await Conversation.find({ participants: userId });
  const userIdString = userId.toString();

  for (const conversation of conversations) {
    conversation.participants = conversation.participants.filter(
      (participantId) => participantId.toString() !== userIdString
    );

    if (conversation.unreadCounts?.delete) {
      conversation.unreadCounts.delete(userIdString);
    }

    if (conversation.lastMessage?.sender?.toString?.() === userIdString) {
      conversation.lastMessage.sender = null;
    }

    if (conversation.participants.length === 0) {
      await Conversation.deleteOne({ _id: conversation._id });
    } else {
      await conversation.save({ validateModifiedOnly: true });
    }
  }
};

export const deleteUser = async (userId, currentUserId) => {
  if (currentUserId?.toString?.() === userId.toString()) {
    throw new AppError('You cannot delete your own account from the admin panel.', 400);
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found.', 404);
  }

  const cleanupTasks = [
    Session.deleteMany({ user: user._id }),
    SharedContent.deleteMany({ $or: [{ owner: user._id }, { targetUser: user._id }] }),
    Note.deleteMany({ author: user._id }),
    Post.deleteMany({ author: user._id }),
    TimelinePost.deleteMany({ author: user._id }),
    Task.deleteMany({ author: user._id }),
    Notification.deleteMany({ recipient: user._id }),
    Message.deleteMany({ sender: user._id }),
    ContactPermission.deleteOne({ user: user._id }),
    PrivacySetting.deleteOne({ user: user._id }),
    BlockedUser.deleteMany({ $or: [{ blocker: user._id }, { blockedUser: user._id }] }),
    ContactRequest.deleteMany({ $or: [{ sender: user._id }, { recipient: user._id }] }),
    UserRelationship.deleteMany({ $or: [{ user: user._id }, { relatedUser: user._id }] }),
    cleanupConversationParticipants(user._id)
  ];

  if (user.avatarStorageKey) {
    cleanupTasks.push(
      deleteStoredAvatar({
        provider: user.avatarStorageProvider,
        storageKey: user.avatarStorageKey
      })
    );
  }

  await Promise.all(cleanupTasks);
  await User.deleteOne({ _id: user._id });

  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email
  };
};
