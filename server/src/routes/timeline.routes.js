import { Router } from 'express';

import {
  getTimelinePosts,
  createNewTimelinePost,
  deleteExistingTimelinePost,
  pinTimelinePost
} from '../controllers/timeline.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const timelineRouter = Router();

timelineRouter.get('/', authenticate, getTimelinePosts);
timelineRouter.post('/', authenticate, createNewTimelinePost);
timelineRouter.delete('/:id', authenticate, deleteExistingTimelinePost);
timelineRouter.patch('/:id/pin', authenticate, pinTimelinePost);

export default timelineRouter;
