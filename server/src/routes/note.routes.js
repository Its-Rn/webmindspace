import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import * as noteController from '../controllers/note.controller.js';

const router = Router();

router.use(authenticate);

router.get('/', noteController.getNotes);
router.get('/tags', noteController.getTags);
router.get('/:noteId', noteController.getNote);
router.post('/', noteController.createNote);
router.patch('/:noteId', noteController.updateNote);
router.delete('/:noteId', noteController.deleteNote);

export default router;
