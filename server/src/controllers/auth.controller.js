import { asyncHandler } from '../utils/asyncHandler.js';
import { clearAuthCookies, cookieNames, setAuthCookies } from '../utils/cookies.js';
import { AppError } from '../utils/appError.js';
import { logoutFromSession, loginAccount, refreshSessionTokens, registerAccount, resendVerificationEmail, requestPasswordReset, resetPassword, verifyEmail, changePassword } from '../services/auth.service.js';
import { verifyRefreshToken } from '../services/token.service.js';

const getRefreshTokenFromRequest = (req) => {
  return req.cookies?.[cookieNames.refreshToken] || req.cookies?.refreshToken || req.body?.refreshToken || null;
};

const respondWithAuthCookies = (res, tokens) => {
  setAuthCookies(res, tokens);
};

export const register = asyncHandler(async (req, res) => {
  const result = await registerAccount(req.body, req);

  res.status(201).json({
    success: true,
    message: 'Registration successful. Please verify your email to activate the account.',
    data: result
  });
});

export const login = asyncHandler(async (req, res) => {
  const result = await loginAccount(req.body, req);
  respondWithAuthCookies(res, result);

  res.status(200).json({
    success: true,
    message: 'Signed in successfully.',
    data: {
      user: result.user
    }
  });
});

export const verifyEmailConfirmation = asyncHandler(async (req, res) => {
  const result = await verifyEmail(req.body, req);
  respondWithAuthCookies(res, result);

  res.status(200).json({
    success: true,
    message: 'Email verified successfully.',
    data: {
      user: result.user
    }
  });
});

export const refreshTokens = asyncHandler(async (req, res) => {
  const refreshToken = getRefreshTokenFromRequest(req);
  const result = await refreshSessionTokens({ refreshToken });
  respondWithAuthCookies(res, result);

  res.status(200).json({
    success: true,
    message: 'Session refreshed successfully.',
    data: {
      user: result.user
    }
  });
});

export const logout = asyncHandler(async (req, res) => {
  const refreshToken = getRefreshTokenFromRequest(req);
  let sessionId = req.auth?.sessionId || null;

  if (!sessionId && refreshToken) {
    try {
      const decoded = verifyRefreshToken(refreshToken);
      sessionId = decoded.sid || null;
    } catch (error) {
      sessionId = null;
    }
  }

  if (sessionId) {
    await logoutFromSession({ sessionId });
  }

  clearAuthCookies(res);

  res.status(200).json({
    success: true,
    message: 'Logged out successfully.'
  });
});

export const me = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Current user fetched successfully.',
    data: {
      user: req.user.toProfileJSON(),
      auth: req.auth
    }
  });
});

export const resendVerification = asyncHandler(async (req, res) => {
  const result = await resendVerificationEmail(req.body);

  res.status(200).json({
    success: true,
    message: result.message,
    data: result
  });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const result = await requestPasswordReset(req.body);

  res.status(200).json({
    success: true,
    message: result.message,
    data: result
  });
});

export const resetPasswordConfirmation = asyncHandler(async (req, res) => {
  const result = await resetPassword(req.body);

  res.status(200).json({
    success: true,
    message: 'Password updated successfully.',
    data: result
  });
});

export const updatePassword = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new AppError('Authentication required.', 401);
  }

  const result = await changePassword({
    userId: req.user._id,
    currentPassword: req.body.currentPassword,
    newPassword: req.body.newPassword,
    sessionId: req.auth?.sessionId || null
  });

  res.status(200).json({
    success: true,
    message: result.message
  });
});
