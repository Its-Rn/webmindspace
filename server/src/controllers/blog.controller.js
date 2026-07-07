import { asyncHandler } from '../utils/asyncHandler.js';
import {
  listPosts,
  getPostBySlug,
  getPostById,
  createPost,
  updatePost,
  deletePost
} from '../services/blog.service.js';

export const getPosts = asyncHandler(async (req, res) => {
  const { status, page, limit } = req.query;
  const filter = {};

  if (status) filter.status = status;
  if (page) filter.page = parseInt(page, 10);
  if (limit) filter.limit = parseInt(limit, 10);

  if (req.query.mine === 'true') {
    filter.authorId = req.user._id;
  }

  const result = await listPosts(filter);

  res.status(200).json({
    success: true,
    message: 'Posts fetched successfully.',
    data: result
  });
});

export const getPost = asyncHandler(async (req, res) => {
  const { slugOrId } = req.params;
  const isObjectId = /^[0-9a-fA-F]{24}$/.test(slugOrId);
  const post = isObjectId ? await getPostById(slugOrId) : await getPostBySlug(slugOrId);

  res.status(200).json({
    success: true,
    message: 'Post fetched successfully.',
    data: { post }
  });
});

export const createNewPost = asyncHandler(async (req, res) => {
  const post = await createPost(req.user._id, req.body);

  res.status(201).json({
    success: true,
    message: 'Post created successfully.',
    data: { post }
  });
});

export const updateExistingPost = asyncHandler(async (req, res) => {
  const post = await updatePost(req.params.id, req.user._id, req.body);

  res.status(200).json({
    success: true,
    message: 'Post updated successfully.',
    data: { post }
  });
});

export const deleteExistingPost = asyncHandler(async (req, res) => {
  const result = await deletePost(req.params.id, req.user._id);

  res.status(200).json({
    success: true,
    message: result.message,
    data: null
  });
});
