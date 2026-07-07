import Post from '../models/Post.js';
import User from '../models/User.js';
import { AppError } from '../utils/appError.js';

const generateSlug = (title) => {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 200) || 'untitled';
};

const ensureUniqueSlug = async (baseSlug, excludeId) => {
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await Post.findOne({ slug, _id: { $ne: excludeId } });
    if (!existing) return slug;
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
};

const applySlug = async (title, excludeId) => {
  const base = generateSlug(title);
  return ensureUniqueSlug(base, excludeId);
};

export const listPosts = async ({ authorId, status, page = 1, limit = 20 }) => {
  const filter = {};

  if (authorId) filter.author = authorId;
  if (status) filter.status = status;

  const skip = (page - 1) * limit;

  const [posts, total] = await Promise.all([
    Post.find(filter)
      .populate('author', 'name avatarUrl')
      .sort({ publishedAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Post.countDocuments(filter)
  ]);

  return {
    posts: posts.map((p) => p.toPostJSON()),
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

export const getPostBySlug = async (slug) => {
  const post = await Post.findOne({ slug }).populate('author', 'name avatarUrl');

  if (!post) {
    throw new AppError('Post not found.', 404);
  }

  return post.toPostJSON();
};

export const getPostById = async (postId) => {
  const post = await Post.findById(postId).populate('author', 'name avatarUrl');

  if (!post) {
    throw new AppError('Post not found.', 404);
  }

  return post.toPostJSON();
};

export const createPost = async (userId, payload) => {
  const slug = await applySlug(payload.title);

  const post = await Post.create({
    ...payload,
    slug,
    author: userId,
    publishedAt: payload.status === 'published' ? new Date() : null
  });

  if (payload.status === 'published') {
    await User.findByIdAndUpdate(userId, { $inc: { 'stats.blogsPublished': 1 } });
  }

  const populated = await post.populate('author', 'name avatarUrl');
  return populated.toPostJSON();
};

export const updatePost = async (postId, userId, payload) => {
  const post = await Post.findById(postId);

  if (!post) {
    throw new AppError('Post not found.', 404);
  }

  if (post.author.toString() !== userId.toString()) {
    throw new AppError('You can only edit your own posts.', 403);
  }

  const wasDraft = post.status === 'draft';
  const becomingPublished = payload.status === 'published';

  if (payload.title && payload.title !== post.title) {
    post.slug = await applySlug(payload.title, postId);
  }

  if (payload.title !== undefined) post.title = payload.title;
  if (payload.content !== undefined) post.content = payload.content;
  if (payload.excerpt !== undefined) post.excerpt = payload.excerpt;
  if (payload.coverImage !== undefined) post.coverImage = payload.coverImage;
  if (payload.status !== undefined) post.status = payload.status;
  if (payload.tags !== undefined) post.tags = payload.tags;
  if (payload.categories !== undefined) post.categories = payload.categories;
  if (payload.seo !== undefined) {
    post.seo = { ...post.seo, ...payload.seo };
  }

  if (wasDraft && becomingPublished) {
    post.publishedAt = new Date();
    await User.findByIdAndUpdate(userId, { $inc: { 'stats.blogsPublished': 1 } });
  }

  await post.save();

  const populated = await post.populate('author', 'name avatarUrl');
  return populated.toPostJSON();
};

export const deletePost = async (postId, userId) => {
  const post = await Post.findById(postId);

  if (!post) {
    throw new AppError('Post not found.', 404);
  }

  if (post.author.toString() !== userId.toString()) {
    throw new AppError('You can only delete your own posts.', 403);
  }

  if (post.status === 'published') {
    await User.findByIdAndUpdate(userId, { $inc: { 'stats.blogsPublished': -1 } });
  }

  await Post.deleteOne({ _id: postId });

  return { message: 'Post deleted successfully.' };
};
