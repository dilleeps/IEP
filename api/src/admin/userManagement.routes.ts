import { Router } from 'express';
import { userManagementController } from './userManagement.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { requireRole } from '../../middleware/authorize.js';

const router = Router();

// All admin routes require authentication and ADMIN role
router.use(authenticate);
router.use(requireRole(['ADMIN']));

// User management
router.get('/users/stats', userManagementController.getUserStats.bind(userManagementController));
router.get('/roles', userManagementController.getRoles.bind(userManagementController));
router.get('/users/:id', userManagementController.getUserById.bind(userManagementController));
router.get('/users', userManagementController.getAllUsers.bind(userManagementController));
router.post('/users', userManagementController.createUser.bind(userManagementController));
router.put('/users/:id', userManagementController.updateUser.bind(userManagementController));
router.delete('/users/:id', userManagementController.deleteUser.bind(userManagementController));

// Registration request management
router.get('/requests/pending', userManagementController.getPendingRequests.bind(userManagementController));
router.post('/requests/approve', userManagementController.approveRequests.bind(userManagementController));
router.post('/requests/reject', userManagementController.rejectRequests.bind(userManagementController));

// Bulk operations
router.post('/users/delete', userManagementController.deleteUsers.bind(userManagementController));
router.post('/users/bulk-update', userManagementController.bulkUpdateUsers.bind(userManagementController));

// CSV Import
router.get('/users/import/template', userManagementController.downloadCSVTemplate.bind(userManagementController));
router.get('/users/import/template/info', userManagementController.getCSVTemplateInfo.bind(userManagementController));
router.post('/users/import/csv', userManagementController.importUsersFromCSV.bind(userManagementController));

export default router;
