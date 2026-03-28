// src/modules/admin/users/admin-users.routes.ts
import { Router } from 'express';
import { AdminUsersController } from './admin-users.controller.js';
import { authenticate } from '../../../middleware/authenticate.js';
import { requireRole } from '../../../middleware/authorize.js';

const router = Router();
const controller = new AdminUsersController();

// All routes require ADMIN role
router.use(authenticate);
router.use(requireRole(['ADMIN']));

router.post('/', controller.create);
router.post('/direct-register', controller.directRegister);
router.post('/register/admin', controller.registerAdmin);
router.post('/register/advocate', controller.registerAdvocate);
router.post('/register/teacher', controller.registerTeacher);
router.post('/register/parent', controller.registerParent);
router.get('/', controller.list);
router.get('/stats', controller.getStats);
router.get('/:id', controller.getById);
router.patch('/:id', controller.update);
router.patch('/:id/status', controller.changeStatus);
router.delete('/:id', controller.delete);

export default router;
