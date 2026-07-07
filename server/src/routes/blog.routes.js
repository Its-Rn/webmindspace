import { Router } from 'express';

import {
  getPosts,
  getPost,
  createNewPost,
  updateExistingPost,
  deleteExistingPost
} from '../controllers/blog.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validateRequest } from '../middleware/validateRequest.middleware.js';
import { createPostSchema, updatePostSchema } from '../validators/blog.validators.js';

const blogRouter = Router();

blogRouter.get('/', authenticate, getPosts);
blogRouter.get('/:slugOrId', authenticate, getPost);
blogRouter.post('/', authenticate, validateRequest(createPostSchema), createNewPost);
blogRouter.patch('/:id', authenticate, validateRequest(updatePostSchema), updateExistingPost);
blogRouter.delete('/:id', authenticate, deleteExistingPost);

export default blogRouter;
