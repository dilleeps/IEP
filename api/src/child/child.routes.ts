import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { requireRole } from '../../middleware/authorize.js';
import { STANDARD_PROTECTED_ROLES } from '../../middleware/roles.js';
import { validateBody, validateParams, validateQuery } from '../../middleware/validate.js';
import { requireResourceOwnership } from '../../middleware/resourceOwnership.js';
import { auditLog } from '../../middleware/auditLog.js';
import { ChildController } from './child.controller.js';
import { createChildSchema, updateChildSchema, childIdSchema, listChildrenQuerySchema } from './child.validation.js';

export const childRouter = Router();
const controller = new ChildController();

// All routes require authentication
childRouter.use(authenticate);
childRouter.use(requireRole(STANDARD_PROTECTED_ROLES));

// List children (user's own)
childRouter.get(
  '/',
  validateQuery(listChildrenQuerySchema),
  controller.list
);

// Create child
childRouter.post(
  '/',
  validateBody(createChildSchema),
  auditLog('child_created', 'child'),
  controller.create
);

// Get specific child
childRouter.get(
  '/:id',
  validateParams(childIdSchema),
  requireResourceOwnership({ resourceType: 'child' }),
  controller.getById
);

// Update child
childRouter.patch(
  '/:id',
  validateParams(childIdSchema),
  validateBody(updateChildSchema),
  requireResourceOwnership({ resourceType: 'child' }),
  auditLog('child_updated', 'child'),
  controller.update
);

// Delete child (soft delete)
childRouter.delete(
  '/:id',
  validateParams(childIdSchema),
  requireResourceOwnership({ resourceType: 'child' }),
  auditLog('child_deleted', 'child'),
  controller.delete
);
