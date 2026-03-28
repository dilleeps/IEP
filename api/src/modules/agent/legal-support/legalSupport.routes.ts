import { Router } from 'express';
import { authenticate } from '../../../middleware/authenticate.js';
import { requireRole } from '../../../middleware/authorize.js';
import { validate } from '../../../middleware/validate.js';
import { LegalSupportController } from './legalSupport.controller.js';
import { getSessionSchema, sendMessageSchema } from './legalSupport.validation.js';

const router = Router();
const controller = new LegalSupportController();

router.use(authenticate);
router.use(requireRole(['PARENT', 'ADVOCATE', 'ADMIN', 'SUPPORT']));

router.post('/sessions', controller.createSession);
router.post('/sessions/:sessionId/messages', validate(sendMessageSchema), controller.sendMessage);
router.get('/sessions/:sessionId', validate(getSessionSchema), controller.getSession);

export default router;
