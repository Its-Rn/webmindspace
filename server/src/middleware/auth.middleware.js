import { AppError } from '../utils/appError.js';
import User from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { verifyAccessToken } from '../services/token.service.js';

const extractToken = (req) => {
  const authHeader = req.headers.authorization;

  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }

  return req.cookies?.accessToken || req.cookies?.ppp_access_token || null;
};

export const authenticate = asyncHandler(async (req, res, next) => {
  const token = extractToken(req);

  if (!token) {
    throw new AppError('Authentication required.', 401);
  }

  let payload;

  try {
    payload = verifyAccessToken(token);
  } catch (error) {
    throw new AppError('Your session has expired. Please sign in again.', 401);
  }

  const user = await User.findById(payload.sub);

  if (!user || !user.isActive) {
    throw new AppError('Account not found or disabled.', 401);
  }

  req.auth = {
    userId: payload.sub,
    sessionId: payload.sid || null,
    role: payload.role,
    emailVerified: Boolean(payload.emailVerified)
  };
  req.user = user;

  next();
});

export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action.', 403));
    }

    return next();
  };
};

