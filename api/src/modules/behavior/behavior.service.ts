// src/modules/behavior/behavior.service.ts
import { BehaviorLog } from './behavior.model.js';
import { BehaviorRepository } from './behavior.repo.js';
import { CreateBehaviorLogDto, UpdateBehaviorLogDto } from './behavior.types.js';
import { AppError } from '../../shared/errors/appError.js';

export class BehaviorService {
  private repo: BehaviorRepository;

  constructor() {
    this.repo = new BehaviorRepository();
  }

  async create(userId: string, data: CreateBehaviorLogDto): Promise<BehaviorLog> {
    return this.repo.create({
      ...data,
      userId,
    } as any);
  }

  async findByUserId(
    userId: string,
    filters?: {
      childId?: string;
      startDate?: string;
      endDate?: string;
      minSeverity?: number;
    }
  ): Promise<BehaviorLog[]> {
    return this.repo.findByUserId(userId, filters);
  }

  async findByChildId(childId: string, limit?: number): Promise<BehaviorLog[]> {
    return this.repo.findByChildId(childId, limit);
  }

  async findById(id: string): Promise<BehaviorLog> {
    const log = await this.repo.findById(id);
    if (!log) {
      throw new AppError('Behavior log not found', 404, 'LOG_NOT_FOUND');
    }
    return log;
  }

  async update(id: string, data: UpdateBehaviorLogDto): Promise<BehaviorLog> {
    await this.findById(id);
    return this.repo.update(id, data);
  }

  async softDelete(id: string): Promise<void> {
    await this.findById(id);
    await this.repo.softDelete(id);
  }

  // TODO: Implement pattern analysis for Smart Legal Prompts feature
  async getPatternAnalysis(childId: string, days: number = 30): Promise<{
    total: number;
    byType: Record<string, number>;
    averageSeverity: number;
    commonTriggers: string[];
    effectiveInterventions: string[];
    timePatterns: Record<string, number>;
  }> {
    // Placeholder - will implement ABC pattern analysis in Phase 2
    return {
      total: 0,
      byType: {},
      averageSeverity: 0,
      commonTriggers: [],
      effectiveInterventions: [],
      timePatterns: {},
    };
  }

  async verifyOwnership(logId: string, userId: string): Promise<boolean> {
    const log = await this.repo.findById(logId);
    return log?.userId === userId;
  }
}

// Export standalone function for middleware
export async function verifyOwnership(logId: string, userId: string): Promise<boolean> {
  const service = new BehaviorService();
  return service.verifyOwnership(logId, userId);
}
