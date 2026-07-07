import ms from 'ms';

import { appEnv } from '../config/env.js';
import Session from '../models/Session.js';
import User from '../models/User.js';
import { AppError } from '../utils/appError.js';
import {
  generateAccessToken,
  generateRefreshToken,
  generateVerificationToken,
  getRefreshTokenTtlMs,
  hashToken,
  verifyRefreshToken
} from './token.service.js';
import { sendEmail } from './email.service.js';

const ONE_DAY = ms('1d');
const ONE_HOUR = ms('1h');

const normalizeEmail = (email) => email.trim().toLowerCase();

const getClientUrl = (path) => {
  const baseUrl = appEnv.clientUrl.replace(/\/$/, '');
  return `${baseUrl}${path}`;
};

const buildRequestMeta = (req) => {
  return {
    userAgent: req.headers['user-agent'] || '',
    ipAddress: req.ip || req.headers['x-forwarded-for'] || ''
  };
};

const buildAuthUser = (user) => user.toAuthJSON();

const createSession = async ({ userId, userAgent, ipAddress }) => {
  return Session.create({
    user: userId,
    expiresAt: new Date(Date.now() + getRefreshTokenTtlMs()),
    userAgent,
    ipAddress,
    lastUsedAt: new Date()
  });
};

const issueAuthPair = (user, sessionId) => {
  const accessToken = generateAccessToken(user, sessionId);
  const refreshToken = generateRefreshToken(user, sessionId);

  return {
    accessToken,
    refreshToken
  };
};

const sendVerificationEmail = async ({ user, token }) => {
  return sendEmail({
    to: user.email,
    subject: 'Your Verification Code',
    text: `Welcome to Pulse, ${user.name}. Your verification code is: ${token}`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a">
        <h2>Verify your email</h2>
        <p>Hello ${user.name},</p>
        <p>Thanks for joining Pulse. Please enter the following 6-digit code to verify your email address:</p>
        <div style="display:inline-block;padding:12px 24px;border-radius:12px;background:#f8fafc;border:2px dashed #cbd5e1;font-size:24px;font-weight:700;letter-spacing:4px;color:#020617;margin:16px 0">
          ${token}
        </div>
        <p>This code will expire in 24 hours.</p>
      </div>
    `
  });
};

const sendPasswordResetEmail = async ({ user, token }) => {
  return sendEmail({
    to: user.email,
    subject: 'Your Password Reset Code',
    text: `Reset your Pulse password using this code: ${token}`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a">
        <h2>Reset your password</h2>
        <p>Hello ${user.name},</p>
        <p>We received a request to reset your password. Use the secure 6-digit code below to proceed:</p>
        <div style="display:inline-block;padding:12px 24px;border-radius:12px;background:#f8fafc;border:2px dashed #cbd5e1;font-size:24px;font-weight:700;letter-spacing:4px;color:#020617;margin:16px 0">
          ${token}
        </div>
        <p>If you did not request this, you can safely ignore this email.</p>
      </div>
    `
  });
};

export const registerAccount = async ({ name, email, password }, req) => {
  const normalizedEmail = normalizeEmail(email);
  const existingUser = await User.findOne({ email: normalizedEmail });

  if (existingUser) {
    throw new AppError('An account with this email already exists.', 409);
  }

  const verificationToken = generateVerificationToken();
  const verificationTokenHash = hashToken(verificationToken);

  const user = await User.create({
    name,
    email: normalizedEmail,
    passwordHash: password,
    emailVerificationTokenHash: verificationTokenHash,
    emailVerificationExpiresAt: new Date(Date.now() + ONE_DAY)
  });

  await sendVerificationEmail({ user, token: verificationToken });

  return {
    user: buildAuthUser(user),
    verificationRequired: true
  };
};

export const verifyEmail = async ({ token, email }, req) => {
  const normalizedEmail = normalizeEmail(email);
  const tokenHash = hashToken(token);

  const user = await User.findOne({
    email: normalizedEmail,
    emailVerificationTokenHash: tokenHash,
    emailVerificationExpiresAt: {
      $gt: new Date()
    }
  });

  if (!user) {
    throw new AppError('The verification link is invalid or has expired.', 400);
  }

  user.isEmailVerified = true;
  user.emailVerifiedAt = new Date();
  user.emailVerificationTokenHash = null;
  user.emailVerificationExpiresAt = null;
  await user.save({ validateModifiedOnly: true });

  const meta = buildRequestMeta(req);
  const session = await createSession({
    userId: user._id,
    userAgent: meta.userAgent,
    ipAddress: meta.ipAddress
  });

  const tokens = issueAuthPair(user, session._id.toString());

  return {
    user: buildAuthUser(user),
    ...tokens
  };
};

export const loginAccount = async ({ email, password }, req) => {
  const normalizedEmail = normalizeEmail(email);
  const user = await User.findOne({ email: normalizedEmail }).select('+passwordHash');

  if (!user || !(await user.comparePassword(password))) {
    throw new AppError('Invalid email or password.', 401);
  }

  if (!user.isActive) {
    throw new AppError('This account has been disabled.', 403);
  }

  if (!user.isEmailVerified) {
    throw new AppError('Please verify your email address before signing in.', 403, {
      verificationRequired: true
    });
  }

  user.lastLoginAt = new Date();
  await user.save({ validateModifiedOnly: true });

  const meta = buildRequestMeta(req);
  const session = await createSession({
    userId: user._id,
    userAgent: meta.userAgent,
    ipAddress: meta.ipAddress
  });

  const tokens = issueAuthPair(user, session._id.toString());

  return {
    user: buildAuthUser(user),
    ...tokens
  };
};

export const refreshSessionTokens = async ({ refreshToken }) => {
  if (!refreshToken) {
    throw new AppError('Refresh token is required.', 401);
  }

  let payload;

  try {
    payload = verifyRefreshToken(refreshToken);
  } catch (error) {
    throw new AppError('Refresh token is invalid or expired.', 401);
  }

  const sessionId = payload.sid;
  const userId = payload.sub;

  const session = await Session.findById(sessionId);

  if (!session || session.revokedAt) {
    throw new AppError('Session is no longer active.', 401);
  }

  if (session.expiresAt.getTime() < Date.now()) {
    await Session.deleteOne({ _id: session._id });
    throw new AppError('Session has expired.', 401);
  }

  const user = await User.findById(userId);

  if (!user || !user.isActive) {
    throw new AppError('Account not found or disabled.', 401);
  }

  session.lastUsedAt = new Date();
  session.expiresAt = new Date(Date.now() + getRefreshTokenTtlMs());
  await session.save({ validateModifiedOnly: true });

  const tokens = issueAuthPair(user, session._id.toString());

  return {
    user: buildAuthUser(user),
    ...tokens
  };
};

export const resendVerificationEmail = async ({ email }) => {
  const normalizedEmail = normalizeEmail(email);
  const user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    return {
      message: 'If an account matches that email, a verification message has been sent.'
    };
  }

  if (user.isEmailVerified) {
    throw new AppError('This email address is already verified.', 409);
  }

  const verificationToken = generateVerificationToken();
  user.emailVerificationTokenHash = hashToken(verificationToken);
  user.emailVerificationExpiresAt = new Date(Date.now() + ONE_DAY);
  await user.save({ validateModifiedOnly: true });

  await sendVerificationEmail({ user, token: verificationToken });

  return {
    message: 'Verification email sent.'
  };
};

export const requestPasswordReset = async ({ email }) => {
  const normalizedEmail = normalizeEmail(email);
  const user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    return {
      message: 'If the account exists, a password reset link has been sent.'
    };
  }

  const resetToken = generateVerificationToken();
  user.passwordResetTokenHash = hashToken(resetToken);
  user.passwordResetExpiresAt = new Date(Date.now() + ONE_HOUR);
  await user.save({ validateModifiedOnly: true });

  await sendPasswordResetEmail({ user, token: resetToken });

  return {
    message: 'Password reset email sent.'
  };
};

export const resetPassword = async ({ token, email, password }) => {
  const normalizedEmail = normalizeEmail(email);
  const tokenHash = hashToken(token);

  const user = await User.findOne({
    email: normalizedEmail,
    passwordResetTokenHash: tokenHash,
    passwordResetExpiresAt: {
      $gt: new Date()
    }
  }).select('+passwordHash');

  if (!user) {
    throw new AppError('The password reset link is invalid or has expired.', 400);
  }

  user.passwordHash = password;
  user.passwordResetTokenHash = null;
  user.passwordResetExpiresAt = null;
  await user.save();

  await Session.deleteMany({ user: user._id });

  return {
    user: buildAuthUser(user)
  };
};

export const changePassword = async ({ userId, currentPassword, newPassword, sessionId }) => {
  const user = await User.findById(userId).select('+passwordHash');

  if (!user) {
    throw new AppError('User not found.', 404);
  }

  const currentPasswordValid = await user.comparePassword(currentPassword);

  if (!currentPasswordValid) {
    throw new AppError('Current password is incorrect.', 400);
  }

  user.passwordHash = newPassword;
  await user.save();

  if (sessionId) {
    await Session.deleteMany({
      user: user._id,
      _id: { $ne: sessionId }
    });
  } else {
    await Session.deleteMany({ user: user._id });
  }

  return {
    message: 'Password updated successfully.'
  };
};

export const logoutFromSession = async ({ sessionId }) => {
  if (sessionId) {
    await Session.deleteOne({ _id: sessionId });
  }

  return {
    message: 'Logged out successfully.'
  };
};
