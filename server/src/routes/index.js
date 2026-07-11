import { Router } from 'express';
import healthRoutes from './health.routes.js';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import publicRoutes from './public.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import blogRoutes from './blog.routes.js';
import timelineRoutes from './timeline.routes.js';
import taskRoutes from './task.routes.js';
import chatRoutes from './chat.routes.js';
import notificationRoutes from './notification.routes.js';
import noteRoutes from './note.routes.js';
import adminRoutes from './admin.routes.js';
import shareRoutes from './share.routes.js';

const apiRouter = Router();

apiRouter.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Personal Productivity Platform API',
    data: {
      version: '0.12.0',
      phase: 'admin'
    }
  });
});

apiRouter.use('/health', healthRoutes);
apiRouter.use('/public', publicRoutes);
apiRouter.use('/auth', authRoutes);
apiRouter.use('/users', userRoutes);
apiRouter.use('/dashboard', dashboardRoutes);
apiRouter.use('/blog', blogRoutes);
apiRouter.use('/timeline', timelineRoutes);
apiRouter.use('/tasks', taskRoutes);
apiRouter.use('/chat', chatRoutes);
apiRouter.use('/notifications', notificationRoutes);
apiRouter.use('/notes', noteRoutes);
apiRouter.use('/admin', adminRoutes);
apiRouter.use('/share', shareRoutes);

export default apiRouter;
