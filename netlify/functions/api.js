import serverless from 'serverless-http';
import { connectDatabase } from '../../server/src/config/database.js';
import { createApp } from '../../server/src/app.js';

let cachedHandler;

export const handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;

  if (!cachedHandler) {
    await connectDatabase();
    const app = createApp();
    cachedHandler = serverless(app, {
      request: (req, event) => {
        req.url = event.path.replace(/^\/\.netlify\/functions\/api/, '') || '/';
      }
    });
  }
  return cachedHandler(event, context);
};
