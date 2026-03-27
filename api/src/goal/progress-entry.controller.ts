import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/authenticate.js';
import { ProgressEntryService } from './progress-entry.service.js';
import { AppError } from '../../shared/errors/appError.js';
import { DashboardService } from '../dashboard/dashboard.service.js';
import { GoalService } from './goal.service.js';

const progressService = new ProgressEntryService();
const dashboardService = new DashboardService();
const goalService = new GoalService();

/**
 * Create progress entry
 * POST /api/progress-entries
 */
export async function createProgressEntry(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const {
      goalId,
      childId,
      reportedDate,
      currentLevel,
      progressValue,
      progressUnit,
      notes,
      evidence,
      confidenceLevel,
      reportedByRole,
      observationContext,
      metadata,
    } = req.body;

    if (!goalId || !childId || !reportedDate || !currentLevel) {
      throw new AppError('Missing required fields', 400, 'MISSING_FIELDS');
    }

    const entry = await progressService.createProgressEntry({
      goalId,
      childId,
      userId,
      reportedDate: new Date(reportedDate),
      currentLevel,
      progressValue,
      progressUnit,
      notes,
      evidence: evidence || [],
      confidenceLevel,
      reportedBy: userId,
      reportedByRole,
      observationContext,
      metadata: metadata || {},
    });

    // Refresh materialized views asynchronously
    dashboardService.refreshMaterializedViews().catch((err) => {
      console.error('Failed to refresh views:', err);
    });

    res.status(201).json({
      success: true,
      data: entry,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get progress entries for a goal
 * GET /api/goals/:goalId/progress-entries
 */
export async function getProgressEntriesByGoal(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const { goalId } = req.params;
    const isOwner = await goalService.verifyOwnership(goalId, userId);

    if (!isOwner && req.user?.role !== 'ADMIN') {
      throw new AppError('Forbidden', 403, 'FORBIDDEN');
    }

    const entries = await progressService.getProgressEntriesByGoal(
      goalId,
      req.user?.role === 'ADMIN' ? undefined : userId
    );

    res.json({
      success: true,
      data: entries,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get progress entries for a child
 * GET /api/children/:childId/progress-entries
 */
export async function getProgressEntriesByChild(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const { childId } = req.params;

    const entries = await progressService.getProgressEntriesByChild(
      childId,
      req.user?.role === 'ADMIN' ? undefined : userId
    );

    res.json({
      success: true,
      data: entries,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete progress entry
 * DELETE /api/progress-entries/:id
 */
export async function deleteProgressEntry(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const isOwner = await progressService.verifyOwnership(id, userId);
    if (!isOwner && req.user?.role !== 'ADMIN') {
      throw new AppError('Forbidden', 403, 'FORBIDDEN');
    }

    await progressService.deleteProgressEntry(id, req.user?.role === 'ADMIN' ? undefined : userId);

    // Refresh materialized views asynchronously
    dashboardService.refreshMaterializedViews().catch((err) => {
      console.error('Failed to refresh views:', err);
    });

    res.json({
      success: true,
      message: 'Progress entry deleted',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get progress timeline for a goal
 * GET /api/goals/:goalId/progress-timeline
 */
export async function getProgressTimeline(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const { goalId } = req.params;
    const isOwner = await goalService.verifyOwnership(goalId, userId);

    if (!isOwner && req.user?.role !== 'ADMIN') {
      throw new AppError('Forbidden', 403, 'FORBIDDEN');
    }

    const timeline = await progressService.getProgressTimeline(goalId);

    res.json({
      success: true,
      data: timeline,
    });
  } catch (error) {
    next(error);
  }
}
