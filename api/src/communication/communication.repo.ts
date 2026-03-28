// src/modules/communication/communication.repo.ts
import { CommunicationLog } from './communication.model.js';
import { BaseRepo } from '../shared/db/base.repo.js';
import { Op } from 'sequelize';

export interface CommunicationFilters {
  childId?: string;
  contactType?: string;
  followUpRequired?: boolean;
  startDate?: Date;
  endDate?: Date;
}

export class CommunicationRepository extends BaseRepo<CommunicationLog> {
  constructor() {
    super(CommunicationLog);
  }

  async findByUserId(userId: string, filters?: CommunicationFilters): Promise<CommunicationLog[]> {
    const where: any = { userId };
    
    if (filters?.childId) where.childId = filters.childId;
    if (filters?.contactType) where.contactType = filters.contactType;
    if (typeof filters?.followUpRequired === 'boolean') where.followUpRequired = filters.followUpRequired;
    
    if (filters?.startDate || filters?.endDate) {
      where.date = {};
      if (filters.startDate) where.date[Op.gte] = filters.startDate;
      if (filters.endDate) where.date[Op.lte] = filters.endDate;
    }

    return this.model.findAll({ where, order: [['date', 'DESC']] });
  }

  async findByChildId(childId: string): Promise<CommunicationLog[]> {
    return this.model.findAll({
      where: { childId },
      order: [['date', 'DESC']],
    });
  }

  async findFollowUpsRequired(userId: string): Promise<CommunicationLog[]> {
    return this.model.findAll({
      where: {
        userId,
        followUpRequired: true,
        followUpDate: {
          [Op.lte]: new Date(),
        },
      },
      order: [['followUpDate', 'ASC']],
    });
  }

  async getStatsByChild(childId: string): Promise<{
    total: number;
    byType: Record<string, number>;
    recentCount: number;
    followUpsPending: number;
  }> {
    const logs = await this.findByChildId(childId);
    
    const byType: Record<string, number> = {};
    let followUpsPending = 0;
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    let recentCount = 0;

    logs.forEach(log => {
      byType[log.contactType] = (byType[log.contactType] || 0) + 1;
      
      if (log.followUpRequired && log.followUpDate && log.followUpDate <= new Date()) {
        followUpsPending++;
      }
      
      if (log.date >= thirtyDaysAgo) {
        recentCount++;
      }
    });

    return {
      total: logs.length,
      byType,
      recentCount,
      followUpsPending,
    };
  }
}
