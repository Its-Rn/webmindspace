import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireAdmin } from '../middleware/admin.middleware.js';
import { validateRequest } from '../middleware/validateRequest.middleware.js';
import { createUserSchema } from '../validators/admin.validators.js';
import { updateSettingsSchema } from '../validators/settings.validators.js';
import * as adminController from '../controllers/admin.controller.js';
import { updateSettings } from '../controllers/settings.controller.js';

const router = Router();

router.use(authenticate);
router.use(requireAdmin);

router.get('/dashboard', adminController.getDashboardStats);
router.post('/users', validateRequest(createUserSchema), adminController.createUser);
router.get('/users', adminController.getUsers);
router.patch('/users/:userId/toggle-active', adminController.toggleUserActive);
router.patch('/users/:userId/toggle-admin', adminController.toggleUserAdmin);
router.patch('/settings', validateRequest(updateSettingsSchema), updateSettings);

export default router;
