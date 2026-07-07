import request from 'supertest';
import mongoose from 'mongoose';
import { createApp } from '../src/app.js';
import { connectDatabase, disconnectDatabase } from '../src/config/database.js';
import User from '../src/models/User.js';

const app = createApp();

const getCookie = (res, name) => {
  const cookies = res.headers['set-cookie'] || [];
  const cookie = cookies.find(c => c.startsWith(`${name}=`));
  if (!cookie) return null;
  return cookie.split(';')[0].split('=')[1];
};

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-secret-key';
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key';
  process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/test-db';
  await connectDatabase();
});

afterAll(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
  await disconnectDatabase();
});

describe('Auth Endpoints', () => {
  const testUser = {
    name: 'Test User',
    email: 'test-auth@example.com',
    password: 'StrongPass123!'
  };

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(testUser)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.user.name).toBe(testUser.name);
      expect(res.body.data.user.email).toBe(testUser.email);
      expect(res.body.data.verificationRequired).toBe(true);

      // Manually verify the user in the database so login works
      await User.updateOne({ email: testUser.email }, { isEmailVerified: true });
    }, 15000);

    it('should reject duplicate email', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(testUser)
        .expect(409);

      expect(res.body.success).toBe(false);
    });

    it('should reject weak password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ name: 'Weak', email: 'weak@example.com', password: '123' })
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login with correct credentials', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: testUser.email, password: testUser.password })
        .expect(200);

      expect(res.body.success).toBe(true);
      const accessToken = getCookie(res, 'ppp_access_token');
      expect(accessToken).toBeDefined();
      expect(accessToken).not.toBeNull();
    });

    it('should reject wrong password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: testUser.email, password: 'WrongPass123!' })
        .expect(401);

      expect(res.body.success).toBe(false);
    });

    it('should reject non-existent email', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'nobody@example.com', password: 'SomePass123!' })
        .expect(401);

      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    it('should refresh tokens', async () => {
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: testUser.email, password: testUser.password });

      const refreshToken = getCookie(loginRes, 'ppp_refresh_token');
      expect(refreshToken).toBeDefined();
      expect(refreshToken).not.toBeNull();

      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Cookie', [`ppp_refresh_token=${refreshToken}`])
        .expect(200);

      expect(res.body.success).toBe(true);
      const newAccessToken = getCookie(res, 'ppp_access_token');
      expect(newAccessToken).toBeDefined();
      expect(newAccessToken).not.toBeNull();
    });
  });
});
