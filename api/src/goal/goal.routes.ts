// src/modules/goal/goal.routes.ts
import { Router } from 'express';
import { GoalController } from './goal.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { requireRole } from '../middleware/authorize.js';
import { STANDARD_PROTECTED_ROLES } from '../middleware/roles.js';
import { validate } from '../middleware/validate.js';
import { requireResourceOwnership } from '../middleware/resourceOwnership.js';
import { requireChildAccess } from '../middleware/childAccess.js';
import {
  createGoalSchema,
  updateGoalSchema,
  updateProgressSchema,
  listGoalsSchema,
  goalParamsSchema,
  childIdParamsSchema,
} from './goal.validation.js';
import {
  createProgressEntry,
  getProgressEntriesByGoal,
  deleteProgressEntry,
  getProgressTimeline,
} from './progress-entry.controller.js';

const router = Router();
const controller = new GoalController();

// All routes require authentication
router.use(authenticate);
router.use(requireRole(STANDARD_PROTECTED_ROLES));

// Goal CRUD
router.post('/', validate(createGoalSchema), requireChildAccess({ bodyField: 'childId' }), controller.create);
router.get('/', validate(listGoalsSchema), requireChildAccess({ queryField: 'childId', required: false }), controller.list);
router.get('/:id', validate(goalParamsSchema), requireResourceOwnership({ resourceType: 'goal' }), controller.getById);
router.put('/:id', validate(updateGoalSchema), requireResourceOwnership({ resourceType: 'goal' }), controller.update);
router.delete('/:id', validate(goalParamsSchema), requireResourceOwnership({ resourceType: 'goal' }), controller.delete);

// Progress tracking
router.patch('/:id/progress', validate(updateProgressSchema), requireResourceOwnership({ resourceType: 'goal' }), controller.updateProgress);

// Progress entries (evidence-based tracking)
router.get('/:goalId/progress-entries', requireResourceOwnership({ resourceType: 'goal', paramName: 'goalId' }), getProgressEntriesByGoal);
router.get('/:goalId/progress-timeline', requireResourceOwnership({ resourceType: 'goal', paramName: 'goalId' }), getProgressTimeline);

// Child-specific endpoints
router.get('/child/:childId', validate(childIdParamsSchema), requireChildAccess({ paramName: 'childId' }), controller.getByChildId);
router.get('/child/:childId/summary', validate(childIdParamsSchema), requireChildAccess({ paramName: 'childId' }), controller.getProgressSummary);

export default router;
