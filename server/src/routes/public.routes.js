import rateLimit from 'express-rate-limit';
import { Router } from 'express';

import { submitContactForm } from '../controllers/public.controller.js';
import { getSettings } from '../controllers/settings.controller.js';
import { validateRequest } from '../middleware/validateRequest.middleware.js';
import { contactFormSchema } from '../validators/public.validators.js';

const publicRouter = Router();

const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many contact requests. Please try again later.'
  }
});

publicRouter.post('/contact', contactLimiter, validateRequest(contactFormSchema), submitContactForm);
publicRouter.get('/settings', getSettings);

export default publicRouter;
