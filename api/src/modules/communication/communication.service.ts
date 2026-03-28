// src/modules/communication/communication.service.ts
import { CommunicationLog } from './communication.model.js';
import { CommunicationRepository } from './communication.repo.js';
import { CreateCommunicationLogDto, UpdateCommunicationLogDto } from './communication.types.js';
import { AppError } from '../../shared/errors/appError.js';
import { notification } from '../../shared/services.js';

export class CommunicationService {
  private repo: CommunicationRepository;

  constructor() {
    this.repo = new CommunicationRepository();
  }

  async create(userId: string, data: CreateCommunicationLogDto): Promise<CommunicationLog> {
    // If no childId provided, get user's first child
    let childId = data.childId;
    if (!childId) {
      const { ChildProfile } = await import('../child/child.model.js');
      const firstChild = await ChildProfile.findOne({ 
        where: { userId },
        attributes: ['id']
      });
      childId = firstChild?.id;
    }

    const log = await this.repo.create({
      ...data,
      userId,
      childId,
      followUpRequired: data.followUpRequired || false,
      attachments: data.attachments || [],
    } as any);

    // Send notification if follow-up is required
    if (data.followUpRequired && data.followUpDate) {
      await this.scheduleFollowUpReminder(log);
    }

    return log;
  }

  async findByUserId(
    userId: string,
    filters?: {
      childId?: string;
      contactType?: string;
      followUpRequired?: boolean;
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<CommunicationLog[]> {
    return this.repo.findByUserId(userId, filters);
  }

  async findByChildId(childId: string): Promise<CommunicationLog[]> {
    return this.repo.findByChildId(childId);
  }

  async findById(id: string): Promise<CommunicationLog> {
    const log = await this.repo.findById(id);
    if (!log) {
      throw new AppError('Communication log not found', 404, 'LOG_NOT_FOUND');
    }
    return log;
  }

  async update(id: string, data: UpdateCommunicationLogDto): Promise<CommunicationLog> {
    const log = await this.findById(id);
    const updated = await this.repo.update(id, data);

    // Update follow-up reminder if changed
    if (data.followUpRequired && data.followUpDate) {
      await this.scheduleFollowUpReminder(updated);
    }

    return updated;
  }

  async softDelete(id: string): Promise<void> {
    await this.findById(id);
    await this.repo.softDelete(id);
  }

  async getFollowUpsRequired(userId: string): Promise<CommunicationLog[]> {
    return this.repo.findFollowUpsRequired(userId);
  }

  async getStatsByChild(childId: string): Promise<{
    total: number;
    byType: Record<string, number>;
    recentCount: number;
    followUpsPending: number;
  }> {
    return this.repo.getStatsByChild(childId);
  }

  async verifyOwnership(logId: string, userId: string): Promise<boolean> {
    const log = await this.repo.findById(logId);
    return log?.userId === userId;
  }

  /**
   * Schedule a follow-up reminder notification
   * In production, this would integrate with a job queue
   */
  private async scheduleFollowUpReminder(log: CommunicationLog): Promise<void> {
    // This is a placeholder for notification scheduling
    // In production, use a job queue like Bull or Agenda
    console.log(`[Communication] Scheduled follow-up reminder for log ${log.id} on ${log.followUpDate}`);
    
    // For demonstration, send immediate notification
    // In production, schedule for the actual followUpDate
    // await notification.sendEmail({
    //   to: 'user@example.com', // Get from user profile
    //   subject: `Follow-up Required: ${log.subject}`,
    //   body: `Don't forget to follow up on your communication with ${log.contactWith} regarding "${log.subject}".`,
    // });
  }
}

// Export standalone function for middleware
export async function verifyOwnership(logId: string, userId: string): Promise<boolean> {
  const service = new CommunicationService();
  return service.verifyOwnership(logId, userId);
}
