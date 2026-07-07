import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import * as chatController from '../controllers/chat.controller.js';

const router = Router();

router.use(authenticate);

router.get('/conversations', chatController.getConversations);
router.get('/conversations/:userId', chatController.getOrCreateConversation);
router.get('/conversations/:conversationId/messages', chatController.getMessages);
router.post('/conversations/:conversationId/messages', chatController.sendMessage);
router.patch('/conversations/:conversationId/read', chatController.markAsRead);
router.patch('/conversations/:conversationId/delivered', chatController.markAsDelivered);
router.delete('/messages/:messageId', chatController.deleteMessage);
router.delete('/messages/:messageId/unsend', chatController.unsendMessage);
router.get('/search/users', chatController.searchUsers);
router.post('/pusher/auth', chatController.pusherAuth);

export default router;
