import { connectDatabase } from '../server/src/config/database.js';
import { createApp } from '../server/src/app.js';

await connectDatabase();
const app = createApp();

export default (req, res) => {
  app(req, res);
};
