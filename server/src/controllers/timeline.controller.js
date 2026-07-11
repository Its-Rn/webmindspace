import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/appError.js';
import {
  listTimelinePosts,
  createTimelinePost,
  deleteTimelinePost,
  updateTimelinePost,
  togglePinPost
} from '../services/timeline.service.js';

export const getTimelinePosts = asyncHandler(async (req, res) => {
  const { page, limit, search, year, month, startDate, endDate } = req.query;
  const result = await listTimelinePosts({
    authorId: req.user._id,
    page: parseInt(page, 10) || 1,
    limit: parseInt(limit, 10) || 20,
    search,
    year,
    month,
    startDate,
    endDate
  });

  res.status(200).json({
    success: true,
    message: 'Timeline posts fetched successfully.',
    data: result
  });
});

export const createNewTimelinePost = asyncHandler(async (req, res) => {
  if (!req.body.content?.trim()) {
    throw new AppError('Content is required.', 400);
  }

  const post = await createTimelinePost(req.user._id, req.body);

  res.status(201).json({
    success: true,
    message: 'Timeline post created successfully.',
    data: { post }
  });
});

export const deleteExistingTimelinePost = asyncHandler(async (req, res) => {
  const result = await deleteTimelinePost(req.params.id, req.user._id, req.user.role);

  res.status(200).json({
    success: true,
    message: result.message,
    data: null
  });
});

export const updateExistingTimelinePost = asyncHandler(async (req, res) => {
  const post = await updateTimelinePost(req.params.id, req.user._id, req.user.role, req.body);

  res.status(200).json({
    success: true,
    message: 'Timeline post updated successfully.',
    data: { post }
  });
});

export const pinTimelinePost = asyncHandler(async (req, res) => {
  const post = await togglePinPost(req.params.id, req.user._id);

  res.status(200).json({
    success: true,
    message: post.isPinned ? 'Post pinned.' : 'Post unpinned.',
    data: { post }
  });
});
