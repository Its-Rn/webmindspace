import request from 'supertest';
import mongoose from 'mongoose';
import { createApp } from '../src/app.js';
import { connectDatabase, disconnectDatabase } from '../src/config/database.js';
import { createTestUser, generateTestToken } from './helpers.js';

const app = createApp();

let user;
let token;

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-secret-key';
  process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/test-db';
  await connectDatabase();

  const created = await createTestUser({ email: 'blog-test@example.com' });
  user = created.user;
  token = generateTestToken(user._id);
});

afterAll(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
  await disconnectDatabase();
});

describe('Blog Endpoints', () => {
  let postId;

  describe('POST /api/v1/blog', () => {
    it('should create a blog post', async () => {
      const res = await request(app)
        .post('/api/v1/blog')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Test Blog Post',
          content: '<p>This is a test blog post content</p>',
          excerpt: 'A test post',
          tags: ['test', 'blog']
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.post.title).toBe('Test Blog Post');
      expect(res.body.data.post.status).toBe('draft');
      postId = res.body.data.post.id;
    });

    it('should reject unauthenticated request', async () => {
      const res = await request(app)
        .post('/api/v1/blog')
        .send({ title: 'No Auth', content: '<p>test</p>' })
        .expect(401);

      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/blog', () => {
    it('should list blog posts', async () => {
      const res = await request(app)
        .get('/api/v1/blog')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.posts)).toBe(true);
    });
  });

  describe('GET /api/v1/blog/:id', () => {
    it('should get a single post', async () => {
      const res = await request(app)
        .get(`/api/v1/blog/${postId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.post.id).toBe(postId);
    });
  });

  describe('PATCH /api/v1/blog/:id', () => {
    it('should update a post', async () => {
      const res = await request(app)
        .patch(`/api/v1/blog/${postId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Updated Title' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.post.title).toBe('Updated Title');
    });
  });

  describe('DELETE /api/v1/blog/:id', () => {
    it('should delete a post', async () => {
      const res = await request(app)
        .delete(`/api/v1/blog/${postId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });
  });
});
