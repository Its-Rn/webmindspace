import User from '../models/User.js';
import { AppError } from '../utils/appError.js';

const formatDateTime = (date) => {
  if (!date) return null;
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date);
};

const computeCompletionPercentage = (user) => {
  const checkpoints = [
    user.avatarUrl,
    user.title,
    user.bio,
    user.location,
    user.website,
    user.timezone,
    user.skills?.length > 0,
    user.socialLinks?.github || user.socialLinks?.linkedin || user.socialLinks?.website || user.socialLinks?.x
  ];
  const completedCount = checkpoints.filter(Boolean).length;
  return Math.round((completedCount / checkpoints.length) * 100);
};

const updateStreak = (user) => {
  const now = new Date();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const lastActive = user.streakUpdatedAt
    ? new Date(Date.UTC(user.streakUpdatedAt.getUTCFullYear(), user.streakUpdatedAt.getUTCMonth(), user.streakUpdatedAt.getUTCDate()))
    : null;

  if (!lastActive) {
    user.dailyStreak = 1;
    user.bestStreak = Math.max(user.bestStreak, 1);
  } else {
    const diffDays = Math.floor((today - lastActive) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return;
    }

    if (diffDays === 1) {
      user.dailyStreak += 1;
    } else {
      user.dailyStreak = 1;
    }

    user.bestStreak = Math.max(user.bestStreak, user.dailyStreak);
  }

  user.streakUpdatedAt = now;
};

const buildActivityTimeline = (user) => {
  return [
    { label: 'Joined Pulse', detail: formatDateTime(user.createdAt), icon: 'spark' },
    { label: 'Email verified', detail: formatDateTime(user.emailVerifiedAt), icon: 'shield' },
    { label: 'Last login', detail: formatDateTime(user.lastLoginAt), icon: 'login' },
    { label: 'Profile refreshed', detail: formatDateTime(user.updatedAt), icon: 'refresh' }
  ].filter((entry) => entry.detail);
};

const buildRecentActivity = (user) => {
  const activities = [];

  if (user.createdAt) {
    activities.push({
      title: 'Account created',
      meta: formatDateTime(user.createdAt),
      detail: 'Your Pulse workspace was set up and ready to go.',
      icon: 'spark'
    });
  }

  if (user.emailVerifiedAt) {
    activities.push({
      title: 'Email verified',
      meta: formatDateTime(user.emailVerifiedAt),
      detail: 'Your email address was confirmed successfully.',
      icon: 'shield'
    });
  }

  if (user.lastLoginAt) {
    activities.push({
      title: 'Last sign-in',
      meta: formatDateTime(user.lastLoginAt),
      detail: 'You logged into your workspace from a trusted device.',
      icon: 'login'
    });
  }

  if (user.updatedAt && user.updatedAt !== user.createdAt) {
    activities.push({
      title: 'Profile updated',
      meta: formatDateTime(user.updatedAt),
      detail: 'Your profile information was refreshed.',
      icon: 'refresh'
    });
  }

  return activities.reverse();
};

const buildWorkspaceMetrics = (user, summary) => {
  return {
    profileCompletion: {
      percentage: summary.completion.percentage,
      isComplete: summary.completion.isComplete,
      hint: summary.completion.isComplete ? 'Ready to share' : 'Keep polishing'
    },
    streak: {
      current: user.dailyStreak,
      best: user.bestStreak,
      updatedAt: formatDateTime(user.streakUpdatedAt)
    },
    stats: {
      tasksCreated: user.stats?.tasksCreated || 0,
      tasksCompleted: user.stats?.tasksCompleted || 0,
      blogsPublished: user.stats?.blogsPublished || 0,
      notesCreated: user.stats?.notesCreated || 0,
      timelinePosts: user.stats?.timelinePosts || 0,
      messagesSent: user.stats?.messagesSent || 0
    },
    momentum: {
      delivery: Math.min(100, (user.stats?.tasksCreated || 0) * 4 + (user.stats?.tasksCompleted || 0) * 8 + (user.stats?.blogsPublished || 0) * 12),
      publishing: Math.min(100, (user.stats?.blogsPublished || 0) * 20 + (user.stats?.notesCreated || 0) * 8),
      collaboration: Math.min(100, (user.stats?.messagesSent || 0) * 3 + (user.stats?.timelinePosts || 0) * 6)
    },
    lastActiveAt: user.lastActiveAt || user.updatedAt || null
  };
};

export const getDashboardData = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError('User not found.', 404);
  }

  updateStreak(user);
  user.lastActiveAt = new Date();
  await user.save();

  const completionPercentage = computeCompletionPercentage(user);

  const summary = {
    completion: {
      percentage: completionPercentage,
      isComplete: completionPercentage >= 100
    },
    streak: {
      current: user.dailyStreak,
      best: user.bestStreak,
      updatedAt: formatDateTime(user.streakUpdatedAt)
    },
    stats: {
      tasksCreated: user.stats?.tasksCreated || 0,
      tasksCompleted: user.stats?.tasksCompleted || 0,
      blogsPublished: user.stats?.blogsPublished || 0,
      notesCreated: user.stats?.notesCreated || 0,
      timelinePosts: user.stats?.timelinePosts || 0,
      messagesSent: user.stats?.messagesSent || 0
    },
    activityTimeline: buildActivityTimeline(user)
  };

  return {
    user: user.toProfileJSON(),
    summary,
    metrics: buildWorkspaceMetrics(user, summary),
    recentActivity: buildRecentActivity(user)
  };
};
