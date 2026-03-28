// src/modules/compliance/compliance.repo.ts
import { ComplianceLog } from './compliance.model.js';
import { BaseRepo } from '../shared/db/base.repo.js';

export interface ComplianceFilters {
  childId?: string;
  serviceType?: string;
  status?: string;
  issueReported?: boolean;
}

export class ComplianceRepository extends BaseRepo<ComplianceLog> {
  constructor() {
    super(ComplianceLog);
  }

  async findByUserId(userId: string, filters?: ComplianceFilters): Promise<ComplianceLog[]> {
    const where: any = { userId };
    
    if (filters?.childId) where.childId = filters.childId;
    if (filters?.serviceType) where.serviceType = filters.serviceType;
    if (filters?.status) where.status = filters.status;
    if (filters?.issueReported !== undefined) where.issueReported = filters.issueReported;

    return this.model.findAll({ where, order: [['serviceDate', 'DESC']] });
  }

  async findByChildId(childId: string): Promise<ComplianceLog[]> {
    return this.model.findAll({
      where: { childId },
      order: [['serviceDate', 'DESC']],
    });
  }

  async updateStatus(id: string, status: string, resolutionStatus?: string): Promise<ComplianceLog> {
    const log = await this.findById(id);
    if (!log) throw new Error('Compliance log not found');

    await log.update({
      status: status as any,
      resolutionStatus: resolutionStatus || log.resolutionStatus,
    });

    return log;
  }
}
