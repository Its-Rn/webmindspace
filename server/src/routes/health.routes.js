import { Router } from 'express';

const healthRouter = Router();

healthRouter.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is healthy',
    data: {
      status: 'ok',
      timestamp: new Date().toISOString()
    }
  });
});

export default healthRouter;

