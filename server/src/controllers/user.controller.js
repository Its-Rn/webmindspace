import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/appError.js';
import { getCurrentUserProfile, updateCurrentUserAvatar, updateCurrentUserProfile } from '../services/user.service.js';

export const getMyProfile = asyncHandler(async (req, res) => {
  const result = await getCurrentUserProfile(req.user._id);

  res.status(200).json({
    success: true,
    message: 'Current user profile fetched successfully.',
    data: result
  });
});

export const updateMyProfile = asyncHandler(async (req, res) => {
  const result = await updateCurrentUserProfile(req.user._id, req.body);

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully.',
    data: result
  });
});

export const updateMyAvatar = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new AppError('Please upload an image file.', 400);
  }

  const result = await updateCurrentUserAvatar(req.user._id, req.file);

  res.status(200).json({
    success: true,
    message: 'Avatar updated successfully.',
    data: result
  });
});

