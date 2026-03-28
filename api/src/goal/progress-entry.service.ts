import { ProgressEntry } from './progress-entries.model.js';
import { GoalProgress } from './goal.model.js';
import { GoalRepository } from './goal.repo.js';
import { AppError } from '../shared/errors/appError.js';
import { logger } from '../config/logger.js';
import { getSequelize } from '../config/sequelize.js';

export interface CreateProgressEntryInput {
  goalId: string;
  childId: string;
  userId: string;
  reportedDate: Date;
  currentLevel: string;
  progressValue?: number;
  progressUnit?: string;
  notes?: string;
  evidence?: string[];
  confidenceLevel?: 'low' | 'medium' | 'high';
  reportedBy: string;
  reportedByRole?: 'parent' | 'teacher' | 'therapist' | 'case_manager' | 'other';
  observationContext?: string;
  metadata?: Record<string, any>;
}

/**
 * ProgressEntryService handles evidence-based progress logging for goals.
 * Each entry updates the goal's overall progress percentage.
 */
export class ProgressEntryService {
  private goalRepo: GoalRepository;

  constructor() {
    this.goalRepo = new GoalRepository();
  }

  /**
   * Create a new progress entry and update goal percentage
   */
  async createProgressEntry(data: CreateProgressEntryInput): Promise<ProgressEntry> {
    const goal = await this.goalRepo.findById(data.goalId);
    if (!goal) {
      throw new AppError('Goal not found', 404, 'GOAL_NOT_FOUND');
    }

    if (goal.userId !== data.userId) {
      throw new AppError('Access denied', 403, 'FORBIDDEN');
    }

    if (goal.childId !== data.childId) {
      throw new AppError('Goal does not belong to the specified child', 400, 'GOAL_CHILD_MISMATCH');
    }

    const sequelize = getSequelize();
    const transaction = await sequelize.transaction();

    try {
      // Create progress entry
      const entry = await ProgressEntry.create({
        ...data,
        evidence: data.evidence || [],
        metadata: data.metadata || {},
      } as any);

      // Recalculate goal progress percentage
      await this.updateProgressPercentage(data.goalId);

      await transaction.commit();

      logger.info(`Created progress entry ${entry.id} for goal ${data.goalId}`);

      return entry;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Update goal's progress percentage based on all progress entries
   */
  async updateProgressPercentage(goalId: string): Promise<void> {
    const entries = await ProgressEntry.findAll({
      where: { goalId, deletedAt: null },
      attributes: ['progressValue'],
    });

    if (entries.length === 0) {
      return;
    }

    // Calculate average progress from entries that have progressValue
    const validEntries = entries.filter((e) => e.progressValue !== null && e.progressValue !== undefined);
    
    if (validEntries.length === 0) {
      return;
    }

    const sum = validEntries.reduce((acc, e) => acc + (e.progressValue || 0), 0);
    const avgProgress = Math.round(sum / validEntries.length);

    // Update goal
    await this.goalRepo.update(goalId, {
      progressPercentage: avgProgress,
      lastUpdated: new Date(),
    } as any);

    logger.info(`Updated goal ${goalId} progress to ${avgProgress}% based on ${validEntries.length} entries`);
  }

  /**
   * Get all progress entries for a goal
   */
  async getProgressEntriesByGoal(goalId: string, userId?: string): Promise<ProgressEntry[]> {
    const where: any = { goalId, deletedAt: null };
    if (userId) where.userId = userId;

    return ProgressEntry.findAll({
      where,
      order: [['reportedDate', 'DESC']],
    });
  }

  /**
   * Get progress entries for a child
   */
  async getProgressEntriesByChild(childId: string, userId?: string): Promise<ProgressEntry[]> {
    const where: any = { childId, deletedAt: null };
    if (userId) where.userId = userId;

    return ProgressEntry.findAll({
      where,
      order: [['reportedDate', 'DESC']],
    });
  }

  /**
   * Soft delete a progress entry and recalculate goal progress
   */
  async deleteProgressEntry(entryId: string, userId?: string): Promise<void> {
    const entry = await ProgressEntry.findByPk(entryId);
    if (!entry) {
      throw new AppError('Progress entry not found', 404, 'ENTRY_NOT_FOUND');
    }

    if (userId && entry.userId !== userId) {
      throw new AppError('Access denied', 403, 'FORBIDDEN');
    }

    const sequelize = getSequelize();
    const transaction = await sequelize.transaction();

    try {
      // Soft delete
      await entry.update({ deletedAt: new Date() });

      // Recalculate goal progress
      await this.updateProgressPercentage(entry.goalId);

      await transaction.commit();

      logger.info(`Deleted progress entry ${entryId}`);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Get progress timeline (grouped by date)
   */
  async getProgressTimeline(goalId: string): Promise<Array<{
    date: string;
    entries: ProgressEntry[];
    avgProgress: number;
  }>> {
    const entries = await this.getProgressEntriesByGoal(goalId);

    const dateMap = new Map<string, ProgressEntry[]>();

    for (const entry of entries) {
      const dateKey = entry.reportedDate.toISOString().split('T')[0];
      const existing = dateMap.get(dateKey) || [];
      existing.push(entry);
      dateMap.set(dateKey, existing);
    }

    return Array.from(dateMap.entries())
      .map(([date, entries]) => {
        const validEntries = entries.filter((e) => e.progressValue !== null && e.progressValue !== undefined);
        const avgProgress = validEntries.length > 0
          ? validEntries.reduce((acc, e) => acc + (e.progressValue || 0), 0) / validEntries.length
          : 0;

        return { date, entries, avgProgress };
      })
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  async verifyOwnership(entryId: string, userId: string): Promise<boolean> {
    const entry = await ProgressEntry.findByPk(entryId);
    return entry?.userId === userId;
  }
}
