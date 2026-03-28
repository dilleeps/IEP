// src/modules/compliance/compliance.routes.ts
import { Router } from 'express';
import { ComplianceController } from './compliance.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { requireRole } from '../../middleware/authorize.js';
import { STANDARD_PROTECTED_ROLES } from '../../middleware/roles.js';
import { validate } from '../../middleware/validate.js';
import { requireResourceOwnership } from '../../middleware/resourceOwnership.js';
import { requireChildAccess } from '../../middleware/childAccess.js';
import {
  createComplianceLogSchema,
  updateComplianceLogSchema,
  updateStatusSchema,
  listComplianceLogsSchema,
  logParamsSchema,
  childIdParamsSchema,
} from './compliance.validation.js';

const router = Router();
const controller = new ComplianceController();

// All routes require authentication
router.use(authenticate);
router.use(requireRole(STANDARD_PROTECTED_ROLES));

// Compliance log CRUD
router.post('/', validate(createComplianceLogSchema), requireChildAccess({ bodyField: 'childId' }), controller.create);
router.get('/', validate(listComplianceLogsSchema), requireChildAccess({ queryField: 'childId', required: false }), controller.list);
router.get('/:id', validate(logParamsSchema), requireResourceOwnership({ resourceType: 'compliance' }), controller.getById);
router.put('/:id', validate(updateComplianceLogSchema), requireResourceOwnership({ resourceType: 'compliance' }), controller.update);
router.delete('/:id', validate(logParamsSchema), requireResourceOwnership({ resourceType: 'compliance' }), controller.delete);

// Status update
router.patch('/:id/status', validate(updateStatusSchema), requireResourceOwnership({ resourceType: 'compliance' }), controller.updateStatus);

// Child-specific endpoints
router.get('/child/:childId', validate(childIdParamsSchema), requireChildAccess({ paramName: 'childId' }), controller.getByChildId);
router.get('/child/:childId/summary', validate(childIdParamsSchema), requireChildAccess({ paramName: 'childId' }), controller.getSummary);
router.post('/child/:childId/summary/regenerate', validate(childIdParamsSchema), requireChildAccess({ paramName: 'childId' }), controller.regenerateSummary);

export default router;
