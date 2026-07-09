import { connectDatabase } from '../server/src/config/database.js';
import { seedIfEmpty } from '../server/src/config/bootstrap.js';
import { createApp } from '../server/src/app.js';

let handler;

export default async (req, res) => {
  if (!handler) {
    try {
      await connectDatabase();
      await seedIfEmpty();
      handler = createApp();
    } catch (err) {
      console.error('Failed to initialize app:', err);
      res.status(500).json({
        success: false,
        message: 'Server initialization failed. Please try again later.'
      });
      return;
    }
  }
  handler(req, res);
};
