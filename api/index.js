import { connectDatabase } from '../server/src/config/database.js';
import { createApp } from '../server/src/app.js';

let app;

export default async (req, res) => {
  if (!app) {
    await connectDatabase();
    app = createApp();
  }
  return app(req, res);
};
