// src/modules/advocacy/advocacy.routes.ts
import { Router } from 'express';
import { AdvocacyController } from './advocacy.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { requireRole } from '../../middleware/authorize.js';
import { STANDARD_PROTECTED_ROLES } from '../../middleware/roles.js';
import { validate } from '../../middleware/validate.js';
import { requireChildAccess } from '../../middleware/childAccess.js';
import {
  createAdvocacyInsightSchema,
  updateAdvocacyInsightSchema,
  generateInsightSchema,
  searchSimilarCasesSchema,
  listAdvocacyInsightsSchema,
  insightIdSchema,
  updateStatusSchema,
  childIdParamsSchema,
} from './advocacy.validation.js';

const router = Router();
const controller = new AdvocacyController();

// All routes require authentication
router.use(authenticate);
router.use(requireRole(STANDARD_PROTECTED_ROLES));

// Meeting Simulation (Advocacy Lab) - MUST come before /:id routes
router.get('/prompts', controller.getQuickPrompts);
router.post('/simulate-meeting', controller.simulateMeeting);
router.post('/sessions', requireChildAccess({ bodyField: 'childId', required: false }), controller.createSession);
router.post('/sessions/:sessionId/messages', controller.sendMessage);
router.get('/sessions/:sessionId', controller.getSession);
router.delete('/sessions/:sessionId', controller.deleteSession);

// Advocacy insight CRUD
router.post('/', validate(createAdvocacyInsightSchema), requireChildAccess({ bodyField: 'childId', required: false }), controller.create);
router.post('/generate', validate(generateInsightSchema), requireChildAccess({ bodyField: 'childId' }), controller.generate);
router.post('/search', validate(searchSimilarCasesSchema), requireChildAccess({ bodyField: 'childId', required: false }), controller.searchSimilar);
router.get('/', validate(listAdvocacyInsightsSchema), requireChildAccess({ queryField: 'childId', required: false }), controller.list);
router.get('/active', controller.getActive);
router.get('/:id', validate(insightIdSchema), controller.getById);
router.put('/:id', validate(updateAdvocacyInsightSchema), controller.update);
router.patch('/:id/status', validate(updateStatusSchema), controller.updateStatus);
router.delete('/:id', validate(insightIdSchema), controller.delete);

// Child-specific endpoints
router.get('/child/:childId/stats', validate(childIdParamsSchema), requireChildAccess({ paramName: 'childId' }), controller.getStatsByChild);

export default router;
