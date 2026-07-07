import { asyncHandler } from '../utils/asyncHandler.js';
import * as settingsService from '../services/settings.service.js';

export const getSettings = asyncHandler(async (req, res) => {
  const settings = await settingsService.getSettings();
  res.status(200).json({
    success: true,
    message: 'Site settings fetched successfully.',
    data: { settings }
  });
});

export const updateSettings = asyncHandler(async (req, res) => {
  const settings = await settingsService.updateSettings(req.body);
  res.status(200).json({
    success: true,
    message: 'Site settings updated successfully.',
    data: { settings }
  });
});
