import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { requireRole } from '../../middleware/authorize.js';
import { validateBody, validateParams, validateQuery } from '../../middleware/validate.js';
import { CounselorController } from './counselor.controller.js';
import {
  catalogSlotsQuerySchema,
  counselorAppointmentIdSchema,
  counselorServiceIdSchema,
  counselorSlotsQuerySchema,
  counselorUserIdParamSchema,
  createCounselorAppointmentSchema,
  createCounselorServiceSchema,
  googleOAuthCallbackQuerySchema,
  markParentCounselorAppointmentPaidSchema,
  replaceAvailabilitySchema,
  updateCounselorAppointmentSchema,
  updateParentCounselorAppointmentSchema,
  updateCounselorAppointmentStatusSchema,
  updateCounselorProfileSchema,
  updateCounselorServiceSchema,
} from './counselor.validation.js';

const router = Router();
const controller = new CounselorController();

router.get('/google/callback', validateQuery(googleOAuthCallbackQuerySchema), controller.handleGoogleOAuthCallback);

router.use(authenticate);

router.get('/catalog', requireRole(['PARENT', 'ADMIN']), controller.listCatalogServices);
router.get('/counselors', requireRole(['PARENT', 'ADMIN']), controller.listCounselors);
router.get(
  '/counselors/:counselorId/slots',
  requireRole(['PARENT', 'ADMIN']),
  validateParams(counselorUserIdParamSchema),
  validateQuery(counselorSlotsQuerySchema),
  controller.listCounselorSlots,
);
router.get(
  '/catalog/:id/slots',
  requireRole(['PARENT', 'COUNSELOR', 'ADMIN']),
  validateParams(counselorServiceIdSchema),
  validateQuery(catalogSlotsQuerySchema),
  controller.listCatalogSlots,
);
router.post('/appointments', requireRole(['PARENT', 'ADMIN']), validateBody(createCounselorAppointmentSchema), controller.createParentAppointment);
router.get('/appointments/mine', requireRole(['PARENT', 'ADMIN']), controller.listParentAppointments);
router.patch(
  '/appointments/mine/:id',
  requireRole(['PARENT', 'ADMIN']),
  validateParams(counselorAppointmentIdSchema),
  validateBody(updateParentCounselorAppointmentSchema),
  controller.updateParentAppointment,
);
router.patch(
  '/appointments/mine/:id/payment',
  requireRole(['PARENT', 'ADMIN']),
  validateParams(counselorAppointmentIdSchema),
  validateBody(markParentCounselorAppointmentPaidSchema),
  controller.markParentAppointmentPaid,
);
router.post(
  '/appointments/mine/:id/payment/session',
  requireRole(['PARENT', 'ADMIN']),
  validateParams(counselorAppointmentIdSchema),
  controller.createParentPaymentSession,
);

router.use(requireRole(['COUNSELOR', 'ADMIN']));

router.get('/google/connect-url', controller.getGoogleConnectUrl);

router.get('/service-metadata', controller.getServiceMetadata);

router.get('/services', controller.listServices);
router.post('/services', validateBody(createCounselorServiceSchema), controller.createService);
router.patch('/services/:id', validateParams(counselorServiceIdSchema), validateBody(updateCounselorServiceSchema), controller.updateService);
router.delete('/services/:id', validateParams(counselorServiceIdSchema), controller.deleteService);

router.get('/availability', controller.listAvailability);
router.put('/availability', validateBody(replaceAvailabilitySchema), controller.replaceAvailability);

router.get('/profile', controller.getProfile);
router.put('/profile', validateBody(updateCounselorProfileSchema), controller.updateProfile);

router.get('/appointments', controller.listAppointments);
router.patch(
  '/appointments/:id/status',
  validateParams(counselorAppointmentIdSchema),
  validateBody(updateCounselorAppointmentStatusSchema),
  controller.updateAppointmentStatus,
);
router.patch(
  '/appointments/:id',
  validateParams(counselorAppointmentIdSchema),
  validateBody(updateCounselorAppointmentSchema),
  controller.updateAppointment,
);
router.post(
  '/appointments/:id/meet-link',
  validateParams(counselorAppointmentIdSchema),
  controller.createAppointmentMeetLink,
);

export default router;
