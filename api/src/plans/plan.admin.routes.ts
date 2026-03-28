// src/modules/plans/plan.admin.routes.ts
import { Router } from 'express';
import { PlanController } from './plan.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { requireRole } from '../middleware/authorize.js';

const router = Router();
const controller = new PlanController();

// All admin plan routes require ADMIN role
router.use(authenticate);
router.use(requireRole(['ADMIN']));

router.get('/', controller.listAdmin);
router.get('/:id', controller.getById);
router.post('/', controller.create);
router.patch('/:id', controller.update);
router.delete('/:id', controller.delete);

export default router;
