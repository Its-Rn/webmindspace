import TimelinePost from '../models/TimelinePost.js';
import User from '../models/User.js';
import SiteSettings from '../models/SiteSettings.js';
import { AppError } from '../utils/appError.js';

export const listTimelinePosts = async ({ authorId, page = 1, limit = 20, search, year, month, startDate, endDate }) => {
  const filter = {};
  if (authorId) filter.author = authorId;

  if (search) {
    filter.content = { $regex: search, $options: 'i' };
  }

  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
  }

  if (year) {
    const y = parseInt(year, 10);
    filter.createdAt = {
      ...filter.createdAt,
      $gte: new Date(`${y}-01-01`),
      $lte: new Date(`${y}-12-31T23:59:59.999Z`)
    };
  }

  if (month && !year) {
    const now = new Date();
    const y = now.getFullYear();
    const m = parseInt(month, 10);
    filter.createdAt = {
      ...filter.createdAt,
      $gte: new Date(`${y}-${String(m).padStart(2, '0')}-01`),
      $lte: new Date(`${y}-${String(m).padStart(2, '0')}-28T23:59:59.999Z`)
    };
  }

  const skip = (page - 1) * limit;

  const [posts, total] = await Promise.all([
    TimelinePost.find(filter)
      .populate('author', 'name avatarUrl')
      .sort({ isPinned: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit),
    TimelinePost.countDocuments(filter)
  ]);

  return {
    posts: posts.map((p) => p.toTimelineJSON()),
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

export const createTimelinePost = async (userId, payload) => {
  const post = await TimelinePost.create({
    content: payload.content,
    mediaUrl: payload.mediaUrl || '',
    author: userId
  });

  await User.findByIdAndUpdate(userId, { $inc: { 'stats.timelinePosts': 1 } });

  const populated = await post.populate('author', 'name avatarUrl');
  return populated.toTimelineJSON();
};

export const deleteTimelinePost = async (postId, userId, userRole) => {
  const post = await TimelinePost.findById(postId);

  if (!post) {
    throw new AppError('Post not found.', 404);
  }

  const settings = await SiteSettings.findOne();
  const canDelete = settings?.allowTimelineDelete === true;

  if (!canDelete) {
    throw new AppError('Deleting timeline posts is disabled.', 403);
  }

  if (post.author.toString() !== userId.toString()) {
    throw new AppError('You can only delete your own timeline posts.', 403);
  }

  await TimelinePost.deleteOne({ _id: postId });
  await User.findByIdAndUpdate(userId, { $inc: { 'stats.timelinePosts': -1 } });

  return { message: 'Timeline post deleted successfully.' };
};

export const updateTimelinePost = async (postId, userId, userRole, payload) => {
  const post = await TimelinePost.findById(postId);

  if (!post) {
    throw new AppError('Post not found.', 404);
  }

  const settings = await SiteSettings.findOne();
  const canEdit = settings?.allowTimelineEdit === true;

  if (!canEdit) {
    throw new AppError('Editing timeline posts is currently disabled by the admin.', 403);
  }

  if (post.author.toString() !== userId.toString()) {
    throw new AppError('You can only edit your own timeline posts.', 403);
  }

  if (payload.content !== undefined) post.content = payload.content;
  if (payload.mediaUrl !== undefined) post.mediaUrl = payload.mediaUrl;

  await post.save();
  const populated = await post.populate('author', 'name avatarUrl');
  return populated.toTimelineJSON();
};

export const togglePinPost = async (postId, userId) => {
  const post = await TimelinePost.findById(postId);

  if (!post) {
    throw new AppError('Post not found.', 404);
  }

  if (post.author.toString() !== userId.toString()) {
    throw new AppError('You can only pin your own timeline posts.', 403);
  }

  if (!post.isPinned) {
    await TimelinePost.updateMany({ author: userId, isPinned: true }, { isPinned: false });
  }

  post.isPinned = !post.isPinned;
  await post.save();

  const populated = await post.populate('author', 'name avatarUrl');
  return populated.toTimelineJSON();
};
