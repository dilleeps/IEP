// src/modules/resource/resource.routes.ts
import { Router } from 'express';
import { ResourceController } from './resource.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { requireRole } from '../../middleware/authorize.js';
import { STANDARD_PROTECTED_ROLES } from '../../middleware/roles.js';
import { validate } from '../../middleware/validate.js';
import {
  createResourceSchema,
  updateResourceSchema,
  listResourcesSchema,
  resourceIdSchema,
  rateResourceSchema,
  popularLimitSchema,
} from './resource.validation.js';

const router = Router();
const controller = new ResourceController();

// All routes require authentication
router.use(authenticate);
router.use(requireRole(STANDARD_PROTECTED_ROLES));

// Resource CRUD
router.post('/', requireRole(['ADMIN']), validate(createResourceSchema), controller.create);
router.get('/', validate(listResourcesSchema), controller.list);
router.get('/popular', validate(popularLimitSchema), controller.getPopular);
router.get('/category/:category', controller.getByCategory);
router.get('/:id', validate(resourceIdSchema), controller.getById);
router.put('/:id', requireRole(['ADMIN']), validate(updateResourceSchema), controller.update);
router.post('/:id/rate', validate(rateResourceSchema), controller.rate);
router.delete('/:id', requireRole(['ADMIN']), validate(resourceIdSchema), controller.delete);

export default router;
