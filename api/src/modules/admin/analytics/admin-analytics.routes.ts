// src/modules/admin/analytics/admin-analytics.routes.ts
import { Router } from 'express';
import { AdminAnalyticsController } from './admin-analytics.controller.js';
import { authenticate } from '../../../middleware/authenticate.js';
import { requireRole } from '../../../middleware/authorize.js';

const router = Router();
const controller = new AdminAnalyticsController();

// All routes require ADMIN role
router.use(authenticate);
router.use(requireRole(['ADMIN']));

router.get('/users', controller.getUserAnalytics);

export default router;
