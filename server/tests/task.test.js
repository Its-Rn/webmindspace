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

  const created = await createTestUser({ email: 'task-test@example.com' });
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

describe('Task Endpoints', () => {
  let taskId;

  it('should create a task', async () => {
    const res = await request(app)
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Test Task',
        description: 'A test task',
        priority: 'high',
        dueDate: new Date(Date.now() + 86400000).toISOString()
      })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.task.title).toBe('Test Task');
    expect(res.body.data.task.status).toBe('pending');
    taskId = res.body.data.task.id;
  });

  it('should list tasks', async () => {
    const res = await request(app)
      .get('/api/v1/tasks')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.tasks)).toBe(true);
  });

  it('should update a task', async () => {
    const res = await request(app)
      .patch(`/api/v1/tasks/${taskId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Updated Task', priority: 'low' })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.task.title).toBe('Updated Task');
  });

  it('should toggle task complete', async () => {
    const res = await request(app)
      .patch(`/api/v1/tasks/${taskId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'completed' })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.task.status).toBe('completed');
    expect(res.body.data.task.completedAt).toBeDefined();
  });

  it('should delete a task', async () => {
    const res = await request(app)
      .delete(`/api/v1/tasks/${taskId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.success).toBe(true);
  });

  it('should reject unauthenticated request', async () => {
    const res = await request(app)
      .post('/api/v1/tasks')
      .send({ title: 'No Auth Task' })
      .expect(401);

    expect(res.body.success).toBe(false);
  });
});
