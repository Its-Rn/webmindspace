import mongoose from 'mongoose';
import dns from 'node:dns';
import { appEnv } from './env.js';
import { ensureSiteSettings } from './ensureSiteSettings.js';

// Fix for Windows DNS resolution failure with mongodb+srv:// SRV records.
// Node.js on Windows sometimes cannot resolve SRV records via the system
// resolver; forcing Google's public DNS servers resolves this reliably.
dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);

let mongodInstance = null;

export const connectDatabase = async () => {
  let uri = appEnv.mongoUri;

  if (!uri) {
    if (appEnv.nodeEnv === 'production') {
      throw new Error('MONGODB_URI is required in production.');
    }

    const { MongoMemoryServer } = await import('mongodb-memory-server-core');
    mongodInstance = await MongoMemoryServer.create();
    uri = mongodInstance.getUri();
    console.log(`Using in-memory MongoDB at ${uri}`);
  }

  mongoose.set('strictQuery', true);

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000,
    maxPoolSize: 10,
    retryWrites: true,
  });

  const dbName = mongoose.connection.db?.databaseName ?? 'unknown';
  console.log(`✅ MongoDB connected → ${mongoose.connection.host} / ${dbName}`);

  try {
    await ensureSiteSettings();
  } catch (err) {
    console.error('Failed to initialize site settings:', err);
  }

  return mongoose.connection;
};

export const disconnectDatabase = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (mongodInstance) {
    await mongodInstance.stop();
    mongodInstance = null;
  }
};
