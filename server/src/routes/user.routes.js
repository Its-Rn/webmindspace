import { Router } from 'express';

import { getMyProfile, updateMyAvatar, updateMyProfile } from '../controllers/user.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { avatarUploadMiddleware } from '../middleware/upload.middleware.js';
import { validateRequest } from '../middleware/validateRequest.middleware.js';
import { updateProfileSchema } from '../validators/user.validators.js';

const userRouter = Router();

userRouter.get('/me', authenticate, getMyProfile);
userRouter.patch('/me', authenticate, validateRequest(updateProfileSchema), updateMyProfile);
userRouter.post('/me/avatar', authenticate, avatarUploadMiddleware.single('avatar'), updateMyAvatar);

export default userRouter;

