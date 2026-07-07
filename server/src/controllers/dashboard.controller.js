import { asyncHandler } from '../utils/asyncHandler.js';
import { getDashboardData } from '../services/dashboard.service.js';

export const getDashboard = asyncHandler(async (req, res) => {
  const data = await getDashboardData(req.user._id);

  res.status(200).json({
    success: true,
    message: 'Dashboard data fetched successfully.',
    data
  });
});
