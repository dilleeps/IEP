// src/modules/advocacy/advocacy.repo.ts
import { AdvocacyInsight } from './advocacy.model.js';
import { BaseRepo } from '../../shared/db/base.repo.js';
import { Op } from 'sequelize';

export interface AdvocacyFilters {
  childId?: string;
  priority?: string;
  status?: string;
  category?: string;
}

export class AdvocacyRepository extends BaseRepo<AdvocacyInsight> {
  constructor() {
    super(AdvocacyInsight);
  }

  async findByUserId(userId: string, filters?: AdvocacyFilters): Promise<AdvocacyInsight[]> {
    const where: any = { userId };
    
    // Only process filters if it's defined and not null
    if (filters && typeof filters === 'object') {
      if (filters.childId) where.childId = filters.childId;
      if (filters.priority) where.priority = filters.priority;
      if (filters.status) where.status = filters.status;
      if (filters.category) where.category = filters.category;
    }

    return this.model.findAll({
      where,
      order: [
        ['priority', 'DESC'],
        ['createdAt', 'DESC'],
      ],
    });
  }

  async findActive(userId: string): Promise<AdvocacyInsight[]> {
    return this.model.findAll({
      where: {
        userId,
        status: 'active',
      },
      order: [
        ['priority', 'DESC'],
        ['createdAt', 'DESC'],
      ],
    });
  }

  async findByPriority(userId: string, priority: string): Promise<AdvocacyInsight[]> {
    return this.model.findAll({
      where: {
        userId,
        priority,
        status: 'active',
      },
      order: [['createdAt', 'DESC']],
    });
  }

  async updateStatus(id: string, status: string, timestamp?: Date): Promise<AdvocacyInsight> {
    const insight = await this.findById(id);
    if (!insight) throw new Error('Insight not found');

    insight.status = status as any;
    
    if (status === 'acknowledged' && timestamp) {
      insight.acknowledgedAt = timestamp;
    } else if (status === 'dismissed' && timestamp) {
      insight.dismissedAt = timestamp;
    }

    await insight.save();
    return insight;
  }

  async getStatsByChild(childId: string): Promise<{
    total: number;
    byPriority: Record<string, number>;
    byCategory: Record<string, number>;
    byStatus: Record<string, number>;
  }> {
    const insights = await this.model.findAll({
      where: { childId },
    });

    const byPriority: Record<string, number> = {};
    const byCategory: Record<string, number> = {};
    const byStatus: Record<string, number> = {};

    insights.forEach(insight => {
      byPriority[insight.priority] = (byPriority[insight.priority] || 0) + 1;
      byCategory[insight.category] = (byCategory[insight.category] || 0) + 1;
      byStatus[insight.status] = (byStatus[insight.status] || 0) + 1;
    });

    return {
      total: insights.length,
      byPriority,
      byCategory,
      byStatus,
    };
  }
}
