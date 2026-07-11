import { Router } from 'express';

import {
  getUsersForSharing,
  createShare,
  createShareBatch,
  removeShare,
  getMyShares,
  getSharedWithMe,
  viewSharedData
} from '../controllers/share.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const shareRouter = Router();

shareRouter.use(authenticate);

shareRouter.get('/users', getUsersForSharing);
shareRouter.post('/create', createShare);
shareRouter.post('/create-batch', createShareBatch);
shareRouter.post('/stop', removeShare);
shareRouter.get('/outgoing', getMyShares);
shareRouter.get('/incoming', getSharedWithMe);
shareRouter.get('/view/:ownerId/:contentType', viewSharedData);

export default shareRouter;
