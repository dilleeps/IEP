// src/modules/behavior/behavior.repo.ts
import { BehaviorLog } from './behavior.model.js';
import { BaseRepo } from '../../shared/db/base.repo.js';
import { Op } from 'sequelize';

export interface BehaviorFilters {
  childId?: string;
  startDate?: string;
  endDate?: string;
  minIntensity?: number;
}

export class BehaviorRepository extends BaseRepo<BehaviorLog> {
  constructor() {
    super(BehaviorLog);
  }

  async findByUserId(userId: string, filters?: BehaviorFilters): Promise<BehaviorLog[]> {
    const where: any = { userId };
    
    if (filters?.childId) where.childId = filters.childId;
    if (filters?.minIntensity) where.intensity = { [Op.gte]: filters.minIntensity };
    
    if (filters?.startDate || filters?.endDate) {
      where.eventDate = {};
      if (filters.startDate) where.eventDate[Op.gte] = filters.startDate;
      if (filters.endDate) where.eventDate[Op.lte] = filters.endDate;
    }

    return this.model.findAll({ where, order: [['eventDate', 'DESC'], ['eventTime', 'DESC']] });
  }

  async findByChildId(childId: string, limit?: number): Promise<BehaviorLog[]> {
    return this.model.findAll({
      where: { childId },
      order: [['eventDate', 'DESC'], ['eventTime', 'DESC']],
      ...(limit ? { limit } : {}),
    });
  }

  // TODO: Implement pattern analysis using new schema (eventDate, eventTime, antecedent, behavior, consequence, intensity)
  // This will be part of Smart Legal Prompts feature - analyze ABC patterns for FBA/BIP recommendations
}
