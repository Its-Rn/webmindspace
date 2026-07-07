import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import hpp from 'hpp';
import path from 'path';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { sanitize } from './middleware/sanitize.middleware.js';
import { fileURLToPath } from 'url';

import { appEnv } from './config/env.js';
import apiRoutes from './routes/index.js';
import { errorMiddleware } from './middleware/error.middleware.js';
import { notFoundMiddleware } from './middleware/notFound.middleware.js';

const serverRootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const uploadsRootDir = path.join(serverRootDir, 'uploads');

export const createApp = () => {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' }
    })
  );
  app.use(
    cors({
      origin: (origin, cb) => {
        if (!origin || appEnv.nodeEnv !== 'production') return cb(null, true);
        cb(null, origin);
      },
      credentials: true
    })
  );
  app.use(compression());
  app.use(morgan(appEnv.nodeEnv === 'production' ? 'combined' : 'dev'));
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 300,
      standardHeaders: true,
      legacyHeaders: false
    })
  );
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));
  app.use(cookieParser());
  app.use(sanitize);
  app.use(hpp());
  app.use('/uploads', express.static(uploadsRootDir));

  app.use('/api/v1', apiRoutes);

  if (appEnv.nodeEnv === 'production') {
    const clientBuildDir = path.resolve(serverRootDir, '..', 'client', 'dist');
    app.use(express.static(clientBuildDir));
    app.get('*', (req, res) => {
      if (!req.path.startsWith('/api')) {
        res.sendFile(path.join(clientBuildDir, 'index.html'));
      }
    });
  }

  app.use(notFoundMiddleware);
  app.use(errorMiddleware);

  return app;
};
