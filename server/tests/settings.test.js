import request from 'supertest';
import mongoose from 'mongoose';
import { createApp } from '../src/app.js';
import { connectDatabase, disconnectDatabase } from '../src/config/database.js';
import { createTestUser, generateTestToken } from './helpers.js';
import User from '../src/models/User.js';

const app = createApp();

let user;
let admin;
let userToken;
let adminToken;

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-secret-key';
  process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/test-db';
  await connectDatabase();

  const createdUser = await createTestUser({ email: 'settings-user@example.com' });
  user = createdUser.user;
  userToken = generateTestToken(user._id, 'user');

  const createdAdmin = await createTestUser({ name: 'Admin', email: 'settings-admin@example.com', role: 'admin' });
  admin = createdAdmin.user;
  // Make sure admin is actually marked admin in db
  await User.updateOne({ _id: admin._id }, { role: 'admin' });
  adminToken = generateTestToken(admin._id, 'admin');
});

afterAll(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
  await disconnectDatabase();
});

describe('Settings Endpoints', () => {
  describe('GET /api/v1/public/settings', () => {
    it('should fetch website settings publicly without authentication', async () => {
      const res = await request(app)
        .get('/api/v1/public/settings')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.settings).toBeDefined();
      expect(res.body.data.settings.siteName).toBe('Pulse');
      expect(res.body.data.settings.siteLogoText).toBe('P');
    });
  });

  describe('PATCH /api/v1/admin/settings', () => {
    const updatedSettings = {
      siteName: 'Updated Portal',
      siteLogoText: 'X',
      siteTagline: 'Next-gen Workspace',
      allowRegistration: false
    };

    it('should reject unauthenticated setting updates', async () => {
      await request(app)
        .patch('/api/v1/admin/settings')
        .send(updatedSettings)
        .expect(401);
    });

    it('should reject updates from non-admin users', async () => {
      const res = await request(app)
        .patch('/api/v1/admin/settings')
        .set('Authorization', `Bearer ${userToken}`)
        .send(updatedSettings)
        .expect(403);

      expect(res.body.success).toBe(false);
    });

    it('should allow updates from admin users', async () => {
      const res = await request(app)
        .patch('/api/v1/admin/settings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updatedSettings)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.settings.siteName).toBe('Updated Portal');
      expect(res.body.data.settings.siteLogoText).toBe('X');
      expect(res.body.data.settings.siteTagline).toBe('Next-gen Workspace');
      expect(res.body.data.settings.allowRegistration).toBe(false);
    });

    it('should reject updates with invalid email', async () => {
      await request(app)
        .patch('/api/v1/admin/settings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ contactEmail: 'not-an-email' })
        .expect(400);
    });
  });
});
