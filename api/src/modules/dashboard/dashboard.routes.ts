// src/modules/dashboard/dashboard.routes.ts
import { Router } from 'express';
import { DashboardController } from './dashboard.controller.js';
import { authenticate } from '../../middleware/authenticate.js';

const router = Router();
const controller = new DashboardController();

// All roles can access their own dashboard
router.use(authenticate);

// Support both `/dashboard` and `/dashboard/summary` for backward compatibility
router.get('/', controller.getSummary);
router.get('/summary', controller.getSummary);
router.get('/overview', controller.getOverview);

export default router;
