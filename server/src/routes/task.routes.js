import { Router } from 'express';

import { getTasks, createNewTask, updateExistingTask, deleteExistingTask } from '../controllers/task.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validateRequest } from '../middleware/validateRequest.middleware.js';
import { createTaskSchema, updateTaskSchema } from '../validators/task.validators.js';

const taskRouter = Router();

taskRouter.get('/', authenticate, getTasks);
taskRouter.post('/', authenticate, validateRequest(createTaskSchema), createNewTask);
taskRouter.patch('/:id', authenticate, validateRequest(updateTaskSchema), updateExistingTask);
taskRouter.delete('/:id', authenticate, deleteExistingTask);

export default taskRouter;
