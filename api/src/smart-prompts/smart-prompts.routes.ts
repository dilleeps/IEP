// src/modules/smart-prompts/smart-prompts.routes.ts
import { Router } from 'express';
import { SmartPromptController } from './smart-prompts.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { requireRole } from '../../middleware/authorize.js';

const router = Router();
const controller = new SmartPromptController();

// All routes require authentication
router.use(authenticate);

// PARENT can access smart prompts
router.get('/', requireRole(['PARENT', 'ADMIN']), controller.list);
router.post('/:id/acknowledge', requireRole(['PARENT']), controller.acknowledge);

export default router;
