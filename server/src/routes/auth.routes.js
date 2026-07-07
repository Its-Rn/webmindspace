import { Router } from 'express';

import {
  forgotPassword,
  login,
  logout,
  me,
  refreshTokens,
  register,
  resendVerification,
  resetPasswordConfirmation,
  updatePassword,
  verifyEmailConfirmation
} from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validateRequest } from '../middleware/validateRequest.middleware.js';
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resendVerificationSchema,
  resetPasswordSchema,
  verifyEmailSchema
} from '../validators/auth.validators.js';

const authRouter = Router();

authRouter.post('/register', validateRequest(registerSchema), register);
authRouter.post('/login', validateRequest(loginSchema), login);
authRouter.post('/verify-email', validateRequest(verifyEmailSchema), verifyEmailConfirmation);
authRouter.post('/resend-verification', validateRequest(resendVerificationSchema), resendVerification);
authRouter.post('/forgot-password', validateRequest(forgotPasswordSchema), forgotPassword);
authRouter.post('/reset-password', validateRequest(resetPasswordSchema), resetPasswordConfirmation);
authRouter.post('/refresh', refreshTokens);
authRouter.post('/logout', logout);
authRouter.get('/me', authenticate, me);
authRouter.patch('/change-password', authenticate, validateRequest(changePasswordSchema), updatePassword);

export default authRouter;

