import http from 'http';
import { createApp } from './app.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { seedIfEmpty } from './config/bootstrap.js';
import { appEnv } from './config/env.js';
import { ensureStorageDirectories } from './config/storage.js';
import { initSocketServer } from './config/socket.js';

const app = createApp();
const server = http.createServer(app);
initSocketServer(server, appEnv.nodeEnv === 'production' ? appEnv.clientUrl : true);

const shutdown = async (reason, error = null) => {
  if (error) {
    console.error(error);
  }

  if (server) {
    await new Promise((resolve) => {
      server.close(resolve);
    });
  }

  await disconnectDatabase();
  console.log(`Server closed gracefully after ${reason}.`);
  process.exit(error ? 1 : 0);
};

const startServer = async () => {
  try {
    await ensureStorageDirectories();
    await connectDatabase();
    await seedIfEmpty();

    server.listen(appEnv.port, () => {
      console.log(`API listening on ${appEnv.serverUrl || `http://localhost:${appEnv.port}`}`);
    });
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('unhandledRejection', (error) => shutdown('unhandledRejection', error));
process.on('uncaughtException', (error) => shutdown('uncaughtException', error));

startServer();
