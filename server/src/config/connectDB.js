import mongoose from 'mongoose';
import dns from 'node:dns';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Fix for Windows DNS resolution failure with mongodb+srv://
dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../../.env') });

let uri = process.env.MONGODB_URI;

if (!uri) {
  uri = 'mongodb://127.0.0.1:27017/productivity-platform';
  console.warn('MONGODB_URI not set, falling back to local MongoDB.');
}

mongoose.set('strictQuery', true);

export const connectDB = async () => {
  if (mongoose.connection.readyState === 1) return mongoose.connection;
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  console.log(`MongoDB connected: ${mongoose.connection.host}`);
  return mongoose.connection;
};

export const disconnectDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
};

export default connectDB;
