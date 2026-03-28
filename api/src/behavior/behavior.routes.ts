// src/modules/behavior/behavior.routes.ts
import { Router } from 'express';
import { BehaviorController } from './behavior.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { requireRole } from '../middleware/authorize.js';
import { STANDARD_PROTECTED_ROLES } from '../middleware/roles.js';
import { validate } from '../middleware/validate.js';
import { requireResourceOwnership } from '../middleware/resourceOwnership.js';
import { requireChildAccess } from '../middleware/childAccess.js';
import {
  createBehaviorLogSchema,
  updateBehaviorLogSchema,
  listBehaviorLogsSchema,
  logParamsSchema,
  childIdParamsSchema,
  patternAnalysisSchema,
} from './behavior.validation.js';

const router = Router();
const controller = new BehaviorController();

// All routes require authentication
router.use(authenticate);
router.use(requireRole(STANDARD_PROTECTED_ROLES));

// Behavior log CRUD
router.post('/', validate(createBehaviorLogSchema), requireChildAccess({ bodyField: 'childId' }), controller.create);
router.get('/', validate(listBehaviorLogsSchema), requireChildAccess({ queryField: 'childId', required: false }), controller.list);
router.get('/:id', validate(logParamsSchema), requireResourceOwnership({ resourceType: 'behavior' }), controller.getById);
router.put('/:id', validate(updateBehaviorLogSchema), requireResourceOwnership({ resourceType: 'behavior' }), controller.update);
router.delete('/:id', validate(logParamsSchema), requireResourceOwnership({ resourceType: 'behavior' }), controller.delete);

// Child-specific endpoints
router.get('/child/:childId', validate(childIdParamsSchema), requireChildAccess({ paramName: 'childId' }), controller.getByChildId);
router.get('/child/:childId/patterns', validate(patternAnalysisSchema), requireChildAccess({ paramName: 'childId' }), controller.getPatternAnalysis);

export default router;
