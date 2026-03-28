// src/modules/communication/communication.routes.ts
import { Router } from 'express';
import { CommunicationController } from './communication.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { requireRole } from '../middleware/authorize.js';
import { STANDARD_PROTECTED_ROLES } from '../middleware/roles.js';
import { validate } from '../middleware/validate.js';
import { requireResourceOwnership } from '../middleware/resourceOwnership.js';
import { requireChildAccess } from '../middleware/childAccess.js';
import {
  createCommunicationLogSchema,
  updateCommunicationLogSchema,
  listCommunicationLogsSchema,
  logParamsSchema,
  childIdParamsSchema,
} from './communication.validation.js';

const router = Router();
const controller = new CommunicationController();

// All routes require authentication
router.use(authenticate);
router.use(requireRole(STANDARD_PROTECTED_ROLES));

// Communication log CRUD
router.post('/', validate(createCommunicationLogSchema), requireChildAccess({ bodyField: 'childId', required: false }), controller.create);
router.get('/', validate(listCommunicationLogsSchema), requireChildAccess({ queryField: 'childId', required: false }), controller.list);
router.get('/:id', validate(logParamsSchema), requireResourceOwnership({ resourceType: 'communication' }), controller.getById);
router.put('/:id', validate(updateCommunicationLogSchema), requireResourceOwnership({ resourceType: 'communication' }), controller.update);
router.delete('/:id', validate(logParamsSchema), requireResourceOwnership({ resourceType: 'communication' }), controller.delete);

// Follow-ups
router.get('/follow-ups/pending', controller.getFollowUps);

// Child-specific endpoints
router.get('/child/:childId', validate(childIdParamsSchema), requireChildAccess({ paramName: 'childId' }), controller.getByChildId);
router.get('/child/:childId/stats', validate(childIdParamsSchema), requireChildAccess({ paramName: 'childId' }), controller.getStats);

export default router;
