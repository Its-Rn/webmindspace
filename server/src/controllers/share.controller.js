import { asyncHandler } from '../utils/asyncHandler.js';
import * as shareService from '../services/share.service.js';

export const getUsersForSharing = asyncHandler(async (req, res) => {
  const users = await shareService.listUsersForSharing(req.user._id);
  res.status(200).json({ success: true, data: { users } });
});

export const createShare = asyncHandler(async (req, res) => {
  const { targetUserId, contentType } = req.body;
  if (!targetUserId || !contentType) {
    return res.status(400).json({ success: false, message: 'targetUserId and contentType are required.' });
  }
  const result = await shareService.shareContent(req.user._id, targetUserId, contentType);
  res.status(201).json({ success: true, message: result.message, data: result });
});

export const createShareBatch = asyncHandler(async (req, res) => {
  const { targetUserId, contentTypes } = req.body;
  if (!targetUserId || !Array.isArray(contentTypes) || contentTypes.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'targetUserId and contentTypes are required.'
    });
  }

  const result = await shareService.shareMultipleContent(req.user._id, targetUserId, contentTypes);
  res.status(201).json({ success: true, message: result.message, data: result });
});

export const removeShare = asyncHandler(async (req, res) => {
  const { targetUserId, contentType } = req.body;
  const result = await shareService.stopSharing(req.user._id, targetUserId, contentType);
  res.status(200).json({ success: true, message: result.message });
});

export const getMyShares = asyncHandler(async (req, res) => {
  const shares = await shareService.getMyShares(req.user._id);
  res.status(200).json({ success: true, data: { shares } });
});

export const getSharedWithMe = asyncHandler(async (req, res) => {
  const shares = await shareService.getSharedWithMe(req.user._id);
  res.status(200).json({ success: true, data: { shares } });
});

export const viewSharedData = asyncHandler(async (req, res) => {
  const { ownerId, contentType } = req.params;
  const data = await shareService.getSharedContentData(req.user._id, ownerId, contentType);
  res.status(200).json({ success: true, data: { items: data } });
});
