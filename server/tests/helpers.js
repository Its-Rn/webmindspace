import jwt from 'jsonwebtoken';
import User from '../src/models/User.js';

export const createTestUser = async (overrides = {}) => {
  const userData = {
    name: 'Test User',
    email: `test-${Date.now()}@example.com`,
    password: 'Password123!',
    ...overrides
  };

  const user = await User.create({
    name: userData.name,
    email: userData.email,
    passwordHash: userData.password
  });

  return {
    user: user.toObject(),
    plainPassword: userData.password,
    email: userData.email
  };
};

export const createTestAdmin = async () => {
  return createTestUser({ name: 'Admin User', email: `admin-${Date.now()}@example.com` });
};

import { generateAccessToken } from '../src/services/token.service.js';

export const generateTestToken = (userId, role = 'user') => {
  return generateAccessToken({ _id: userId, role, isEmailVerified: true }, 'test-session-id');
};

