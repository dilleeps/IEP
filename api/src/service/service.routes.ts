import { Router } from 'express';
import { Response, NextFunction } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { type AuthRequest } from '../middleware/authenticate.js';
import { requireRole } from '../middleware/authorize.js';
import { STANDARD_PROTECTED_ROLES } from '../middleware/roles.js';
import { requireChildAccess } from '../middleware/childAccess.js';
import { ServiceLogService } from './service-log.service.js';
import { AppError } from '../shared/errors/appError.js';

const router = Router();
const serviceLogService = new ServiceLogService();

// All routes require authentication
router.use(authenticate);
router.use(requireRole(STANDARD_PROTECTED_ROLES));

/**
 * Create service log
 * POST /api/services/logs
 */
router.post('/logs', requireChildAccess({ bodyField: 'childId' }), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const {
      serviceId,
      childId,
      sessionDate,
      minutesDelivered,
      provider,
      location,
      status,
      missedReason,
      notes,
      goalsAddressed,
    } = req.body;

    if (!serviceId || !childId || !sessionDate || !status) {
      throw new AppError('Missing required fields', 400, 'MISSING_FIELDS');
    }

    await serviceLogService.assertServiceAccess(serviceId, req.user!.id, req.user?.role);
    await serviceLogService.assertChildAccess(childId, req.user!.id, req.user?.role);

    const log = await serviceLogService.createServiceLog({
      serviceId,
      childId,
      sessionDate: new Date(sessionDate),
      minutesDelivered,
      provider,
      location,
      status,
      missedReason,
      notes,
      goalsAddressed: goalsAddressed || [],
    });

    res.status(201).json({
      success: true,
      data: log,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get logs for a service
 * GET /api/services/:serviceId/logs
 */
router.get('/:serviceId/logs', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { serviceId } = req.params;
    await serviceLogService.assertServiceAccess(serviceId, req.user!.id, req.user?.role);

    const logs = await serviceLogService.getLogsByService(serviceId);

    res.json({
      success: true,
      data: logs,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get compliance report for a service
 * GET /api/services/:serviceId/compliance
 */
router.get('/:serviceId/compliance', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { serviceId } = req.params;
    await serviceLogService.assertServiceAccess(serviceId, req.user!.id, req.user?.role);

    const report = await serviceLogService.getComplianceReport(serviceId);

    res.json({
      success: true,
      data: report,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get delivery timeline for a service
 * GET /api/services/:serviceId/timeline
 */
router.get('/:serviceId/timeline', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { serviceId } = req.params;
    const { startDate, endDate } = req.query;
    await serviceLogService.assertServiceAccess(serviceId, req.user!.id, req.user?.role);

    const timeline = await serviceLogService.getDeliveryTimeline(
      serviceId,
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );

    res.json({
      success: true,
      data: timeline,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get services by child
 * GET /api/services/child/:childId
 */
router.get('/child/:childId', requireChildAccess({ paramName: 'childId' }), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { childId } = req.params;

    const services = await serviceLogService.getServicesByChild(childId);

    res.json({
      success: true,
      data: services,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get active services for a child
 * GET /api/services/child/:childId/active
 */
router.get('/child/:childId/active', requireChildAccess({ paramName: 'childId' }), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { childId } = req.params;

    const services = await serviceLogService.getActiveServices(childId);

    res.json({
      success: true,
      data: services,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get logs for a child
 * GET /api/services/logs/child/:childId
 */
router.get('/logs/child/:childId', requireChildAccess({ paramName: 'childId' }), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { childId } = req.params;

    const logs = await serviceLogService.getLogsByChild(childId);

    res.json({
      success: true,
      data: logs,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
