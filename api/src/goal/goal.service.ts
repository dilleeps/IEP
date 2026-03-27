// src/modules/goal/goal.service.ts
import { GoalProgress } from './goal.model.js';
import { GoalRepository } from './goal.repo.js';
import { CreateGoalDto, UpdateGoalDto, UpdateProgressDto } from './goal.types.js';
import { AppError } from '../../shared/errors/appError.js';

export class GoalService {
  private repo: GoalRepository;

  constructor() {
    this.repo = new GoalRepository();
  }

  async create(userId: string, data: CreateGoalDto): Promise<GoalProgress> {
    const domain = data.domain || data.category || 'other';
    return this.repo.create({
      ...data,
      domain,
      userId,
      status: 'not_started',
      progressPercentage: 0,
      notes: data.notes || '',
      milestonesData: data.milestonesData || {},
      lastUpdated: new Date(),
      goalName: data.goalName || data.goalText.substring(0, 500),
      currentValue: '0',
      targetValue: '100',
    } as any);
  }

  async findByUserId(
    userId: string,
    filters?: {
      childId?: string;
      category?: string;
      status?: string;
    }
  ): Promise<GoalProgress[]> {
    return this.repo.findByUserId(userId, filters);
  }

  async findByChildId(childId: string): Promise<GoalProgress[]> {
    return this.repo.findByChildId(childId);
  }

  async findById(id: string): Promise<GoalProgress> {
    const goal = await this.repo.findById(id);
    if (!goal) {
      throw new AppError('Goal not found', 404, 'GOAL_NOT_FOUND');
    }
    return goal;
  }

  async update(id: string, data: UpdateGoalDto): Promise<GoalProgress> {
    await this.findById(id);
    const domain = data.domain || data.category;
    return this.repo.update(id, {
      ...data,
      ...(domain ? { domain } : {}),
      lastUpdated: new Date(),
    } as any);
  }

  async updateProgress(id: string, data: UpdateProgressDto): Promise<GoalProgress> {
    const goal = await this.findById(id);
    
    return this.repo.updateProgress(
      id,
      data.progressPercentage,
      data.status,
      data.notes
    );
  }

  async softDelete(id: string): Promise<void> {
    await this.findById(id);
    await this.repo.softDelete(id);
  }

  async getProgressSummary(childId: string): Promise<{
    total: number;
    byStatus: Record<string, number>;
    byCategory: Record<string, number>;
    averageProgress: number;
  }> {
    return this.repo.getProgressSummary(childId);
  }

  async verifyOwnership(goalId: string, userId: string): Promise<boolean> {
    const goal = await this.repo.findById(goalId);
    return goal?.userId === userId;
  }
}

// Export standalone function for middleware
export async function verifyOwnership(goalId: string, userId: string): Promise<boolean> {
  const service = new GoalService();
  return service.verifyOwnership(goalId, userId);
}
