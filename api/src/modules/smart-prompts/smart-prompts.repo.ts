// src/modules/smart-prompts/smart-prompts.repo.ts
import { SmartPrompt } from '../advocacy/smartPrompt.model.js';
import { BaseRepo } from '../../shared/db/base.repo.js';
import { Op } from 'sequelize';

interface ListPromptsFilters {
  userId: string;
  category?: string;
  priority?: string;
  acknowledged?: boolean;
  childId?: string;
}

export class SmartPromptRepository extends BaseRepo<SmartPrompt> {
  constructor() {
    super(SmartPrompt);
  }

  async findByUserId(
    filters: ListPromptsFilters,
    page: number = 1,
    limit: number = 20
  ): Promise<{ rows: SmartPrompt[]; count: number }> {
    const where: any = {
      userId: filters.userId,
      [Op.or]: [
        { expiresAt: null },
        { expiresAt: { [Op.gt]: new Date() } },
      ],
    };

    if (filters.category) {
      where.category = filters.category;
    }

    if (filters.priority) {
      where.priority = filters.priority;
    }

    if (filters.acknowledged !== undefined) {
      where.acknowledged = filters.acknowledged;
    }

    if (filters.childId) {
      where.childId = filters.childId;
    }

    return await this.model.findAndCountAll({
      where,
      order: [
        ['priority', 'DESC'],
        ['createdAt', 'DESC'],
      ],
      limit,
      offset: (page - 1) * limit,
    });
  }

  async countUnacknowledged(userId: string): Promise<number> {
    const count = await this.model.count({
      where: {
        userId,
        acknowledged: false,
        [Op.or]: [
          { expiresAt: null },
          { expiresAt: { [Op.gt]: new Date() } },
        ],
      } as any,
    });
    return typeof count === 'number' ? count : 0;
  }

  async acknowledge(id: string, userId: string): Promise<boolean> {
    const [affected] = await this.model.update(
      {
        acknowledged: true,
        acknowledgedAt: new Date(),
      },
      {
        where: {
          id,
          userId,
          acknowledged: false,
        } as any,
      }
    );

    return affected > 0;
  }

  async findByIdAndUserId(id: string, userId: string): Promise<SmartPrompt | null> {
    return await this.model.findOne({
      where: {
        id,
        userId,
      } as any,
    });
  }
}
