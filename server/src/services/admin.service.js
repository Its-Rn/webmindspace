import User from '../models/User.js';
import Post from '../models/Post.js';
import TimelinePost from '../models/TimelinePost.js';
import Task from '../models/Task.js';
import Note from '../models/Note.js';
import Message from '../models/Message.js';
import Conversation from '../models/Conversation.js';
import Notification from '../models/Notification.js';

export const getDashboardStats = async () => {
  const [
    totalUsers,
    activeUsers,
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
    .select('name email role isActive createdAt')
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

export const createUser = async ({ name, email, password, role, isEmailVerified, isActive }) => {
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw Object.assign(new Error('A user with this email already exists'), { statusCode: 409 });
  }

  const userData = { name, email, passwordHash: password, role, isActive };

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
    throw Object.assign(new Error('User not found'), { statusCode: 404 });
  }
  user.isActive = !user.isActive;
  await user.save();
  return user.toProfileJSON();
};

export const toggleUserAdmin = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw Object.assign(new Error('User not found'), { statusCode: 404 });
  }
  user.role = user.role === 'admin' ? 'user' : 'admin';
  await user.save();
  return user.toProfileJSON();
};
