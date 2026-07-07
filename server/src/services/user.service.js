import User from '../models/User.js';
import { AppError } from '../utils/appError.js';
import { deleteStoredAvatar, uploadAvatarFile } from './media.service.js';

const formatDateTime = (date) => {
  if (!date) {
    return null;
  }

  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date);
};

const normalizeUrl = (value) => {
  if (typeof value !== 'string') {
    return '';
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return '';
  }

  const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    return new URL(candidate).toString();
  } catch (error) {
    throw new AppError('Please provide a valid URL.', 400);
  }
};

const normalizeSkills = (skills) => {
  if (!skills) {
    return [];
  }

  const skillItems = Array.isArray(skills)
    ? skills
    : String(skills)
        .split(',')
        .map((skill) => skill.trim());

  return [...new Set(skillItems.map((skill) => skill.trim()).filter(Boolean))].slice(0, 12);
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

const buildActivityTimeline = (user) => {
  return [
    {
      label: 'Joined Pulse',
      detail: formatDateTime(user.createdAt),
      icon: 'spark'
    },
    {
      label: 'Email verified',
      detail: formatDateTime(user.emailVerifiedAt),
      icon: 'shield'
    },
    {
      label: 'Last login',
      detail: formatDateTime(user.lastLoginAt),
      icon: 'login'
    },
    {
      label: 'Profile refreshed',
      detail: formatDateTime(user.updatedAt),
      icon: 'refresh'
    }
  ].filter((entry) => entry.detail);
};

const buildProfileSummary = (user) => {
  const completionPercentage = computeCompletionPercentage(user);

  return {
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
      tasksCompleted: user.stats?.tasksCompleted || 0,
      blogsPublished: user.stats?.blogsPublished || 0,
      notesCreated: user.stats?.notesCreated || 0,
      timelinePosts: user.stats?.timelinePosts || 0,
      messagesSent: user.stats?.messagesSent || 0
    },
    activityTimeline: buildActivityTimeline(user)
  };
};

const buildProfileResponse = (user) => {
  return {
    user: user.toProfileJSON(),
    summary: buildProfileSummary(user)
  };
};

export const getCurrentUserProfile = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError('User not found.', 404);
  }

  return buildProfileResponse(user);
};

export const updateCurrentUserProfile = async (userId, payload) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError('User not found.', 404);
  }

  if (payload.name !== undefined) {
    user.name = payload.name.trim();
  }

  if (payload.title !== undefined) {
    user.title = payload.title?.trim() || '';
  }

  if (payload.bio !== undefined) {
    user.bio = payload.bio?.trim() || '';
  }

  if (payload.location !== undefined) {
    user.location = payload.location?.trim() || '';
  }

  if (payload.website !== undefined) {
    user.website = normalizeUrl(payload.website);
  }

  if (payload.timezone !== undefined) {
    user.timezone = payload.timezone?.trim() || '';
  }

  if (payload.skills !== undefined) {
    user.skills = normalizeSkills(payload.skills);
  }

  if (payload.socialLinks !== undefined) {
    const existingLinks = user.socialLinks || {};
    user.socialLinks = {
      website: normalizeUrl(payload.socialLinks.website ?? existingLinks.website ?? ''),
      github: normalizeUrl(payload.socialLinks.github ?? existingLinks.github ?? ''),
      linkedin: normalizeUrl(payload.socialLinks.linkedin ?? existingLinks.linkedin ?? ''),
      x: normalizeUrl(payload.socialLinks.x ?? existingLinks.x ?? '')
    };
  }

  user.lastActiveAt = new Date();
  await user.save();

  return buildProfileResponse(user);
};

export const updateCurrentUserAvatar = async (userId, file) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError('User not found.', 404);
  }

  const uploadedAvatar = await uploadAvatarFile(file);

  if (user.avatarStorageKey) {
    await deleteStoredAvatar({
      provider: user.avatarStorageProvider,
      storageKey: user.avatarStorageKey
    });
  }

  user.avatarUrl = uploadedAvatar.url;
  user.avatarStorageProvider = uploadedAvatar.provider;
  user.avatarStorageKey = uploadedAvatar.storageKey;
  user.lastActiveAt = new Date();
  await user.save();

  return buildProfileResponse(user);
};
