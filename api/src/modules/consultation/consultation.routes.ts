import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { requireRole } from '../../middleware/authorize.js';
import { validateBody, validateParams, validateQuery } from '../../middleware/validate.js';
import { ConsultationController } from './consultation.controller.js';
import {
  availableSlotsQuerySchema,
  cancelConsultationSchema,
  consultationIdSchema,
  createConsultationSchema,
  createConsultationSlotSchema,
  createConsultationSlotsBulkSchema,
  slotIdSchema,
  updateConsultationSchema,
} from './consultation.validation.js';

const router = Router();
const controller = new ConsultationController();

router.use(authenticate);

// ─── Parent routes ────────────────────────────────────────────────────────
// View available slots (parents + admin)
router.get(
  '/slots',
  requireRole(['PARENT', 'ADMIN']),
  validateQuery(availableSlotsQuerySchema),
  controller.listAvailableSlots,
);

// Book a consultation
router.post(
  '/book',
  requireRole(['PARENT']),
  validateBody(createConsultationSchema),
  controller.bookConsultation,
);

// List my consultations
router.get(
  '/mine',
  requireRole(['PARENT']),
  controller.listMyConsultations,
);

// Cancel my consultation
router.post(
  '/mine/:id/cancel',
  requireRole(['PARENT']),
  validateParams(consultationIdSchema),
  controller.cancelMyConsultation,
);

// ─── Admin routes ─────────────────────────────────────────────────────────
// Create a single slot
router.post(
  '/slots',
  requireRole(['ADMIN']),
  validateBody(createConsultationSlotSchema),
  controller.createSlot,
);

// Create slots in bulk
router.post(
  '/slots/bulk',
  requireRole(['ADMIN']),
  validateBody(createConsultationSlotsBulkSchema),
  controller.createSlotsBulk,
);

// Delete an available slot
router.delete(
  '/slots/:id',
  requireRole(['ADMIN']),
  validateParams(slotIdSchema),
  controller.deleteSlot,
);

// List all consultations (admin view)
router.get(
  '/all',
  requireRole(['ADMIN']),
  controller.listAllConsultations,
);

// Update consultation (status, expert notes, meet link)
router.patch(
  '/:id',
  requireRole(['ADMIN']),
  validateParams(consultationIdSchema),
  validateBody(updateConsultationSchema),
  controller.updateConsultation,
);

export default router;
