import { Router } from 'express';
import { LeadController } from './lead.controller.js';
import { validateBody, validateQuery } from '../../middleware/validate.js';
import { authenticate } from '../../middleware/authenticate.js';
import { requireRole } from '../../middleware/authorize.js';
import { authRateLimit } from '../../middleware/rateLimit.js';
import { createLeadSchema, listLeadsSchema } from './lead.validation.js';

export const leadRouter = Router();
const controller = new LeadController();

/**
 * Public route - Create new lead with reCAPTCHA protection
 * POST /api/v1/leads
 */
leadRouter.post(
  '/',
  authRateLimit, // Rate limit to prevent abuse
  validateBody(createLeadSchema),
  controller.createLead
);

/**
 * Admin routes - List leads and get statistics
 * Requires authentication and ADMIN role
 */
leadRouter.get(
  '/',
  authenticate,
  requireRole(['ADMIN']),
  validateQuery(listLeadsSchema),
  controller.listLeads
);

leadRouter.get(
  '/stats',
  authenticate,
  requireRole(['ADMIN']),
  controller.getLeadStats
);
