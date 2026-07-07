import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import ms from 'ms';

import { appEnv } from '../config/env.js';
import { AppError } from '../utils/appError.js';

const ISSUER = 'personal-productivity-platform';
const AUDIENCE = 'personal-productivity-platform-web';

const requireSecret = (secret, label) => {
  if (!secret) {
    throw new AppError(`${label} is required to start authentication flows.`, 500);
  }

  return secret;
};

const parseDuration = (duration) => {
  const parsedDuration = ms(duration);

  if (typeof parsedDuration !== 'number') {
    throw new AppError(`Invalid token duration: ${duration}`, 500);
  }

  return parsedDuration;
};

export const getAccessTokenTtlMs = () => parseDuration(appEnv.jwtAccessExpiresIn);
export const getRefreshTokenTtlMs = () => parseDuration(appEnv.jwtRefreshExpiresIn);

export const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

export const generateVerificationToken = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const generateAccessToken = (user, sessionId) => {
  return jwt.sign(
    {
      sid: sessionId,
      role: user.role,
      emailVerified: user.isEmailVerified
    },
    requireSecret(appEnv.jwtAccessSecret, 'JWT_ACCESS_SECRET'),
    {
      subject: user._id.toString(),
      expiresIn: appEnv.jwtAccessExpiresIn,
      issuer: ISSUER,
      audience: AUDIENCE
    }
  );
};

export const generateRefreshToken = (user, sessionId) => {
  return jwt.sign(
    {
      sid: sessionId
    },
    requireSecret(appEnv.jwtRefreshSecret, 'JWT_REFRESH_SECRET'),
    {
      subject: user._id.toString(),
      expiresIn: appEnv.jwtRefreshExpiresIn,
      issuer: ISSUER,
      audience: AUDIENCE
    }
  );
};

export const verifyAccessToken = (token) => {
  return jwt.verify(token, requireSecret(appEnv.jwtAccessSecret, 'JWT_ACCESS_SECRET'), {
    issuer: ISSUER,
    audience: AUDIENCE
  });
};

export const verifyRefreshToken = (token) => {
  return jwt.verify(token, requireSecret(appEnv.jwtRefreshSecret, 'JWT_REFRESH_SECRET'), {
    issuer: ISSUER,
    audience: AUDIENCE
  });
};

