// src/modules/config/admin/admin-config.routes.ts
import { Router } from 'express';
import { AdminConfigController } from './admin-config.controller.js';
import { authenticate } from '../../../middleware/authenticate.js';
import { requireRole } from '../../../middleware/authorize.js';

const router = Router();
const controller = new AdminConfigController();

// All routes require ADMIN role
router.use(authenticate);
router.use(requireRole(['ADMIN']));

router.post('/', controller.create);
router.get('/', controller.list);
router.get('/:id', controller.getById);
router.patch('/:id', controller.update);
router.delete('/:id', controller.delete);

export default router;
