// src/modules/goal/goal.repo.ts
import { GoalProgress } from './goal.model.js';
import { IepDocument } from '../document/document.model.js';
import { BaseRepo } from '../shared/db/base.repo.js';

export interface GoalFilters {
  childId?: string;
  category?: string;
  status?: string;
}

export class GoalRepository extends BaseRepo<GoalProgress> {
  constructor() {
    super(GoalProgress);
  }

  override findById(id: string, options?: any): Promise<GoalProgress | null> {
    return this.model.findByPk(id, {
      ...options,
      include: [{
        model: IepDocument,
        as: 'document',
        attributes: ['iepStartDate', 'iepEndDate'],
        required: false,
      }],
    });
  }

  async findByUserId(userId: string, filters?: GoalFilters): Promise<GoalProgress[]> {
    const where: any = { userId };

    if (filters?.childId) where.childId = filters.childId;
    if (filters?.category) where.domain = filters.category;
    if (filters?.status) where.status = filters.status;

    return this.model.findAll({
      where,
      include: [{
        model: IepDocument,
        as: 'document',
        attributes: ['iepStartDate', 'iepEndDate'],
        required: false,
      }],
      order: [['lastUpdated', 'DESC']],
    });
  }

  async findByChildId(childId: string): Promise<GoalProgress[]> {
    return this.model.findAll({
      where: { childId },
      include: [{
        model: IepDocument,
        as: 'document',
        attributes: ['iepStartDate', 'iepEndDate'],
        required: false,
      }],
      order: [['lastUpdated', 'DESC']],
    });
  }

  async findByDocumentId(documentId: string): Promise<GoalProgress[]> {
    return this.model.findAll({
      where: { documentId },
      order: [['createdAt', 'DESC']],
    });
  }

  async deleteByDocumentId(documentId: string): Promise<number> {
    const result = await this.model.destroy({
      where: { documentId },
    });
    return result; // Returns number of deleted rows
  }

  async updateProgress(
    id: string,
    progressPercentage: number,
    status: string,
    notes?: string
  ): Promise<GoalProgress> {
    const goal = await this.findById(id);
    if (!goal) throw new Error('Goal not found');

    await goal.update({
      progressPercentage,
      status: status as any,
      notes: notes || goal.notes,
      lastUpdated: new Date(),
    });

    return goal;
  }

  async getProgressSummary(childId: string): Promise<{
    total: number;
    byStatus: Record<string, number>;
    byCategory: Record<string, number>;
    averageProgress: number;
  }> {
    const goals = await this.findByChildId(childId);
    
    const byStatus: Record<string, number> = {};
    const byCategory: Record<string, number> = {};
    let totalProgress = 0;
    let goalsWithProgress = 0;

    goals.forEach(goal => {
      byStatus[goal.status] = (byStatus[goal.status] || 0) + 1;
      byCategory[goal.domain] = (byCategory[goal.domain] || 0) + 1;
      
      if (goal.progressPercentage !== undefined && goal.progressPercentage !== null) {
        totalProgress += Number(goal.progressPercentage);
        goalsWithProgress++;
      }
    });

    return {
      total: goals.length,
      byStatus,
      byCategory,
      averageProgress: goalsWithProgress > 0 ? totalProgress / goalsWithProgress : 0,
    };
  }
}
