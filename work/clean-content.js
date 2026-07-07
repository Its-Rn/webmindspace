import dns from 'node:dns';
dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);

import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '..', 'server', '.env') });

const uri = process.env.MONGODB_URI;
if (!uri) { console.error('MONGODB_URI not set'); process.exit(1); }

async function clean() {
  await mongoose.connect(uri);
  
  const collections = ['posts', 'tasks', 'notes', 'timelineposts', 'conversations', 'messages', 'notifications', 'sessions'];
  for (const col of collections) {
    const result = await mongoose.connection.db.collection(col).deleteMany({});
    console.log('  ' + col + ': ' + result.deletedCount + ' deleted');
  }
  
  const userColl = mongoose.connection.db.collection('users');
  await userColl.updateMany({}, { $set: { 'stats.tasksCompleted': 0, 'stats.blogsPublished': 0, 'stats.notesCreated': 0, 'stats.timelinePosts': 0, 'stats.messagesSent': 0 } });
  console.log('  users: stats reset');
  
  await mongoose.disconnect();
  console.log('Done - all sample content removed.');
}

clean().catch(err => { console.error(err.message); process.exit(1); });
