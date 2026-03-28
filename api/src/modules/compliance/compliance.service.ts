// src/modules/compliance/compliance.service.ts
import { ComplianceLog } from './compliance.model.js';
import { ComplianceRepository } from './compliance.repo.js';
import { CreateComplianceLogDto, UpdateComplianceLogDto, UpdateStatusDto } from './compliance.types.js';
import { AppError } from '../../shared/errors/appError.js';

export class ComplianceService {
  private repo: ComplianceRepository;

  constructor() {
    this.repo = new ComplianceRepository();
  }

  async create(userId: string, data: CreateComplianceLogDto): Promise<ComplianceLog> {
    const log = await this.repo.create({
      ...data,
      userId,
      notes: data.notes || '',
      attachments: data.attachments || [],
    } as any);

    return log;
  }

  async findByUserId(
    userId: string,
    filters?: {
      childId?: string;
      issueType?: string;
      status?: string;
      severity?: string;
    }
  ): Promise<ComplianceLog[]> {
    return this.repo.findByUserId(userId, filters);
  }

  async findByChildId(childId: string): Promise<ComplianceLog[]> {
    return this.repo.findByChildId(childId);
  }

  async findById(id: string): Promise<ComplianceLog> {
    const log = await this.repo.findById(id);
    if (!log) {
      throw new AppError('Compliance log not found', 404, 'LOG_NOT_FOUND');
    }
    return log;
  }

  async update(id: string, data: UpdateComplianceLogDto): Promise<ComplianceLog> {
    await this.findById(id);
    return this.repo.update(id, data);
  }

  async updateStatus(id: string, data: UpdateStatusDto): Promise<ComplianceLog> {
    await this.findById(id);
    return this.repo.updateStatus(id, data.status, data.resolutionStatus);
  }

  async softDelete(id: string): Promise<void> {
    await this.findById(id);
    await this.repo.softDelete(id);
  }

  async verifyOwnership(logId: string, userId: string): Promise<boolean> {
    const log = await this.repo.findById(logId);
    return log?.userId === userId;
  }

  async getSummary(childId: string): Promise<any> {
    const logs = await this.repo.findByChildId(childId);
    
    const totalIssues = logs.filter(l => l.issueReported).length;
    const openIssues = logs.filter(l => l.issueReported && l.status !== 'resolved').length;
    const resolvedIssues = logs.filter(l => l.issueReported && l.status === 'resolved').length;
    const criticalIssues = logs.filter(l => l.issueReported && l.resolutionStatus === 'critical').length;
    
    const complianceScore = logs.length > 0 ? ((logs.length - totalIssues) / logs.length) * 100 : 100;
    
    const issueBreakdown: Record<string, number> = {};
    logs.filter(l => l.issueReported).forEach(log => {
      issueBreakdown[log.serviceType] = (issueBreakdown[log.serviceType] || 0) + 1;
    });
    
    return {
      childId,
      totalIssues,
      openIssues,
      resolvedIssues,
      criticalIssues,
      complianceScore,
      createdAt: new Date(),
      issueBreakdown,
    };
  }

  async regenerateSummary(childId: string): Promise<any> {
    // For now, regenerate is the same as get - in future, could trigger AI analysis
    return this.getSummary(childId);
  }
}

// Export standalone function for middleware
export async function verifyOwnership(logId: string, userId: string): Promise<boolean> {
  const service = new ComplianceService();
  return service.verifyOwnership(logId, userId);
}
