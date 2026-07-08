import dotenv from 'dotenv';
import dns from 'node:dns';
import mongoose from 'mongoose';
import User from './src/models/User.js';

dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('MONGODB_URI is required. Set it in server/.env or as an environment variable.');
  process.exit(1);
}

const users = [
  {
    name: 'Kunal Admin',
    email: 'kunal@gmail.com',
    passwordHash: '2212Aryan@3',
    role: 'admin',
    isActive: true,
    isEmailVerified: true
  },
  {
    name: 'Aryan User',
    email: 'aryan@gmail.com',
    passwordHash: '0902@Aryan3',
    role: 'user',
    isActive: true,
    isEmailVerified: true
  }
];

const seed = async () => {
  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000
    });

    console.log(`Connected to MongoDB: ${mongoose.connection.host}`);

    for (const userData of users) {
      const existing = await User.findOne({ email: userData.email });
      if (existing) {
        console.log(`User already exists: ${userData.email}`);
        continue;
      }

      await User.create(userData);
      console.log(`Created user: ${userData.email} (${userData.role})`);
    }

    console.log('Seed complete.');
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
};

seed();
