// src/modules/plans/plan.public.routes.ts
import { Router } from 'express';
import { PlanController } from './plan.controller.js';
import { authenticate } from '../middleware/authenticate.js';

const router = Router();
const controller = new PlanController();

// Publicly accessible — no auth required (for login page pricing section)
router.get('/', controller.listPublic);

// Authenticated: create a checkout session for a plan
router.post('/:id/checkout', authenticate, controller.createCheckout);

export default router;
