import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import * as chatController from '../controllers/chat.controller.js';

const router = Router();

router.use(authenticate);

router.get('/conversations', chatController.getConversations);
router.get('/conversations/:userId', chatController.getOrCreateConversation);
router.post('/groups', chatController.createGroupConversation);
router.get('/conversations/:conversationId/messages', chatController.getMessages);
router.post('/conversations/:conversationId/messages', chatController.sendMessage);
router.patch('/conversations/:conversationId/read', chatController.markAsRead);
router.patch('/conversations/:conversationId/delivered', chatController.markAsDelivered);
router.patch('/conversations/:conversationId/pin', chatController.togglePinConversation);
router.delete('/messages/:messageId', chatController.deleteMessage);
router.delete('/messages/:messageId/unsend', chatController.unsendMessage);
router.get('/search/users', chatController.searchUsers);
router.get('/users', chatController.getChatDirectory);
router.get('/permissions/me', chatController.getMyContactPermission);
router.put('/permissions/me', chatController.updateMyContactPermission);
router.get('/privacy/me', chatController.getMyPrivacySetting);
router.put('/privacy/me', chatController.updateMyPrivacySetting);
router.get('/blocks', chatController.getBlockedUsers);
router.post('/blocks', chatController.blockUser);
router.delete('/blocks/:userId', chatController.unblockUser);
router.get('/contact-requests', chatController.getContactRequests);
router.post('/contact-requests', chatController.createContactRequest);
router.patch('/contact-requests/:requestId', chatController.respondToContactRequest);
router.patch('/favorites/:userId', chatController.toggleFavoriteUser);
router.get('/policy', authorize('admin'), chatController.getChatPolicy);
router.put('/policy', authorize('admin'), chatController.updateChatPolicy);
router.post('/pusher/auth', chatController.pusherAuth);

export default router;
