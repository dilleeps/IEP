// src/modules/ai/conversation/conversation.routes.ts
import { Router } from 'express';
import { ConversationController } from './conversation.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { requireRole } from '../../middleware/authorize.js';

const router = Router();
const controller = new ConversationController();

// All routes require authentication
router.use(authenticate);

// PARENT, ADVOCATE can create and manage their own conversations
router.post('/', requireRole(['PARENT', 'ADVOCATE']), controller.create);
router.get('/', requireRole(['PARENT', 'ADVOCATE', 'ADMIN']), controller.list);
router.get('/:conversationId', requireRole(['PARENT', 'ADVOCATE', 'ADMIN']), controller.getById);
router.post('/:conversationId/messages', requireRole(['PARENT', 'ADVOCATE']), controller.sendMessage);
router.patch('/:conversationId/archive', requireRole(['PARENT', 'ADVOCATE']), controller.archive);

export default router;
