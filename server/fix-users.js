import { connectDatabase, disconnectDatabase } from './src/config/database.js';
import { ensureDemoUsers } from './src/config/ensureDemoUsers.js';

try {
  await connectDatabase();
  await ensureDemoUsers();
} catch (error) {
  console.error('Failed to reset demo users:', error.message);
  process.exitCode = 1;
} finally {
  await disconnectDatabase();
}
