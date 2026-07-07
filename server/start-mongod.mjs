/**
 * Starts a MongoDB instance via mongodb-memory-server-core on a fixed port.
 * Keeps running so Compass, seed scripts, and the app can connect.
 * Press Ctrl+C to stop.
 */
import { MongoMemoryServer } from 'mongodb-memory-server-core';

const PORT = 27017;
const DB_NAME = 'productivity-platform';
const BINARY_DIR = 'H:\\web\\master-prompt-build-a-full-stack\\node_modules\\.cache\\mongodb-memory-server';

const mongod = await MongoMemoryServer.create({
  instance: {
    port: PORT,
    dbName: DB_NAME,
    storageEngine: 'wiredTiger',
    dbPath: 'H:\\web\\master-prompt-build-a-full-stack\\server\\data',
  },
  binary: {
    downloadDir: BINARY_DIR,
  },
});

const uri = mongod.getUri();
console.log(`\n  MongoDB running at: mongodb://127.0.0.1:${PORT}/${DB_NAME}`);
console.log(`  URI: ${uri}`);
console.log(`  Press Ctrl+C to stop.\n`);

process.on('SIGINT', async () => {
  console.log('\nShutting down...');
  await mongod.stop();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await mongod.stop();
  process.exit(0);
});

// Keep alive
await new Promise(() => {});
