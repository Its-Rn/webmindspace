import SharedContent from '../models/SharedContent.js';
import User from '../models/User.js';
import Note from '../models/Note.js';
import Post from '../models/Post.js';
import TimelinePost from '../models/TimelinePost.js';
import * as notificationService from './notification.service.js';
import { AppError } from '../utils/appError.js';

const allowedContentTypes = new Set(['timeline', 'notes', 'blog']);
const contentTypeLabels = {
  timeline: 'Timeline',
  notes: 'Notes',
  blog: 'Blog'
};

const getShareLink = (ownerId, contentType, ownerName, contentLabel) => {
  const baseLink = `/${contentType}`;
  if (contentType === 'notes') {
    return `/notes?mode=read&sharedOwnerId=${ownerId}&sharedOwnerName=${encodeURIComponent(ownerName)}&contentType=notes&contentTitle=${encodeURIComponent(contentLabel)}`;
  }
  if (contentType === 'timeline') {
    return `/timeline?mode=read&sharedOwnerId=${ownerId}&sharedOwnerName=${encodeURIComponent(ownerName)}&contentType=timeline&contentTitle=${encodeURIComponent(contentLabel)}`;
  }
  if (contentType === 'blog') {
    return `/blog?mode=read&sharedOwnerId=${ownerId}&sharedOwnerName=${encodeURIComponent(ownerName)}&contentType=blog&contentTitle=${encodeURIComponent(contentLabel)}`;
  }
  return baseLink;
};

const notifySharedContent = async ({ ownerId, targetUserId, contentType }) => {
  const [owner] = await Promise.all([
    User.findById(ownerId).select('name').lean()
  ]);

  const contentLabel = contentTypeLabels[contentType] || 'Content';
  const ownerName = owner?.name || 'Someone';

  await notificationService.createNotification(
    targetUserId,
    'share',
    `${ownerName} shared ${contentLabel}`,
    `Tap to open ${contentLabel.toLowerCase()} in reading mode.`,
    getShareLink(ownerId, contentType, ownerName, contentLabel),
    null,
    {
      senderName: ownerName,
      contentTitle: contentLabel,
      contentType
    }
  );
};

const ensureContentType = (contentType) => {
  if (!allowedContentTypes.has(contentType)) {
    throw new AppError('Invalid content type.', 400);
  }
};

export const shareContent = async (ownerId, targetUserId, contentType) => {
  ensureContentType(contentType);

  if (ownerId.toString() === targetUserId.toString()) {
    throw new AppError('You cannot share data with yourself.', 400);
  }

  const targetUser = await User.findById(targetUserId);
  if (!targetUser) {
    throw new AppError('Target user not found.', 404);
  }

  if (!targetUser.isActive) {
    throw new AppError('You can only share with active users.', 400);
  }

  if (!targetUser.isEmailVerified) {
    throw new AppError('You can only share with verified users.', 400);
  }

  const existing = await SharedContent.findOne({
    owner: ownerId,
    targetUser: targetUserId,
    contentType
  });

  if (existing) {
    if (existing.isActive) {
      throw new AppError('This content is already shared with this user.', 400);
    }
    existing.isActive = true;
    await existing.save();
    await notifySharedContent({ ownerId, targetUserId, contentType });
    return { message: 'Sharing reactivated.', share: existing };
  }

  const share = await SharedContent.create({
    owner: ownerId,
    targetUser: targetUserId,
    contentType
  });

  await notifySharedContent({ ownerId, targetUserId, contentType });

  return { message: 'Content shared successfully.', share };
};

export const shareMultipleContent = async (ownerId, targetUserId, contentTypes) => {
  if (!Array.isArray(contentTypes) || contentTypes.length === 0) {
    throw new AppError('At least one content type is required.', 400);
  }

  const uniqueContentTypes = [...new Set(contentTypes.filter(Boolean))];
  const sharedContentTypes = [];

  try {
    for (const contentType of uniqueContentTypes) {
      await shareContent(ownerId, targetUserId, contentType);
      sharedContentTypes.push(contentType);
    }

    return {
      message: 'Content shared successfully.',
      contentTypes: sharedContentTypes
    };
  } catch (error) {
    await Promise.all(
      sharedContentTypes.map((contentType) =>
        stopSharing(ownerId, targetUserId, contentType).catch(() => null)
      )
    );
    throw error;
  }
};

export const stopSharing = async (ownerId, targetUserId, contentType) => {
  ensureContentType(contentType);

  const share = await SharedContent.findOne({
    owner: ownerId,
    targetUser: targetUserId,
    contentType,
    isActive: true
  });

  if (!share) {
    throw new AppError('No active share found for this content and user.', 404);
  }

  share.isActive = false;
  await share.save();

  return { message: 'Sharing stopped successfully.' };
};

export const getMyShares = async (ownerId) => {
  const shares = await SharedContent.find({ owner: ownerId, isActive: true })
    .populate('targetUser', 'name email avatarUrl')
    .sort({ createdAt: -1 });

  return shares.map((s) => ({
    id: s._id,
    targetUser: s.targetUser,
    contentType: s.contentType,
    createdAt: s.createdAt
  }));
};

export const getSharedWithMe = async (userId) => {
  const shares = await SharedContent.find({ targetUser: userId, isActive: true })
    .populate('owner', 'name email avatarUrl')
    .sort({ createdAt: -1 });

  return shares.map((s) => ({
    id: s._id,
    owner: s.owner,
    contentType: s.contentType,
    createdAt: s.createdAt
  }));
};

export const getSharedContentData = async (userId, ownerId, contentType) => {
  ensureContentType(contentType);

  const share = await SharedContent.findOne({
    owner: ownerId,
    targetUser: userId,
    contentType,
    isActive: true
  });

  if (!share) {
    throw new AppError('No shared content found for this user.', 404);
  }

  let data = [];

  switch (contentType) {
    case 'timeline':
      data = await TimelinePost.find({ author: ownerId })
        .populate('author', 'name avatarUrl')
        .sort({ isPinned: -1, createdAt: -1 })
        .limit(50);
      data = data.map((p) => p.toTimelineJSON());
      break;
    case 'notes':
      data = await Note.find({ author: ownerId, isDeleted: false })
        .populate('author', 'name avatarUrl')
        .sort({ isPinned: -1, updatedAt: -1 })
        .limit(50);
      break;
    case 'blog':
      data = await Post.find({ author: ownerId, status: 'published' })
        .sort({ publishedAt: -1 })
        .limit(50);
      data = data.map((p) => p.toPostJSON());
      break;
    default:
      throw new AppError('Invalid content type.', 400);
  }

  return data;
};

export const listUsersForSharing = async (currentUserId) => {
  const users = await User.find({
    _id: { $ne: currentUserId },
    isActive: true,
    isEmailVerified: true
  })
    .select('name email avatarUrl')
    .sort({ name: 1 })
    .limit(100);

  return users;
};
