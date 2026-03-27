import { Service, ServiceLog } from './service.model.js';
import { AppError } from '../../shared/errors/appError.js';
import { logger } from '../../config/logger.js';
import { getSequelize } from '../../config/sequelize.js';
import { Op } from 'sequelize';
import { ChildProfile } from '../child/child.model.js';

export interface CreateServiceLogInput {
  serviceId: string;
  childId: string;
  sessionDate: Date;
  minutesDelivered?: number;
  provider?: string;
  location?: 'resource_room' | 'general_ed' | 'pull_out' | 'push_in' | 'teletherapy';
  status: 'completed' | 'missed' | 'canceled' | 'makeup';
  missedReason?: string;
  notes?: string;
  goalsAddressed?: string[];
}

/**
 * ServiceLogService tracks service delivery (attendance, sessions).
 * Updates service statistics asynchronously.
 */
export class ServiceLogService {
  /**
   * Create a service log entry and update service stats
   */
  async createServiceLog(data: CreateServiceLogInput): Promise<ServiceLog> {
    const service = await Service.findByPk(data.serviceId);
    if (!service) {
      throw new AppError('Service not found', 404, 'SERVICE_NOT_FOUND');
    }

    if (service.childId !== data.childId) {
      throw new AppError('Service does not belong to specified child', 400, 'SERVICE_CHILD_MISMATCH');
    }

    const sequelize = getSequelize();
    const transaction = await sequelize.transaction();

    try {
      // Create log
      const log = await ServiceLog.create({
        ...data,
        goalsAddressed: data.goalsAddressed || [],
      } as any, { transaction });

      // Update service delivery stats (async)
      await this.updateServiceStats(data.serviceId, transaction);

      await transaction.commit();

      logger.info(`Created service log ${log.id} for service ${data.serviceId}`);

      return log;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Update service delivery statistics based on logs
   */
  async updateServiceStats(serviceId: string, transaction?: any): Promise<void> {
    const completedCount = await ServiceLog.count({
      where: {
        serviceId,
        status: 'completed',
      },
      transaction,
    });

    await Service.update(
      { totalSessionsDelivered: completedCount },
      {
        where: { id: serviceId },
        transaction,
      }
    );

    logger.info(`Updated service ${serviceId} stats: ${completedCount} sessions delivered`);
  }

  /**
   * Get logs for a service
   */
  async getLogsByService(serviceId: string): Promise<ServiceLog[]> {
    return ServiceLog.findAll({
      where: { serviceId },
      order: [['sessionDate', 'DESC']],
    });
  }

  /**
   * Get logs for a child
   */
  async getLogsByChild(childId: string): Promise<ServiceLog[]> {
    return ServiceLog.findAll({
      where: { childId },
      order: [['sessionDate', 'DESC']],
    });
  }

  /**
   * Get service compliance report (percentage of delivered sessions)
   */
  async getComplianceReport(serviceId: string): Promise<{
    totalPlanned: number;
    totalDelivered: number;
    compliancePercentage: number;
    missedSessions: number;
    canceledSessions: number;
  }> {
    const service = await Service.findByPk(serviceId);
    if (!service) {
      throw new AppError('Service not found', 404, 'SERVICE_NOT_FOUND');
    }

    const missedCount = await ServiceLog.count({
      where: { serviceId, status: 'missed' },
    });

    const canceledCount = await ServiceLog.count({
      where: { serviceId, status: 'canceled' },
    });

    const compliancePercentage = service.totalSessionsPlanned > 0
      ? Math.round((service.totalSessionsDelivered / service.totalSessionsPlanned) * 100)
      : 0;

    return {
      totalPlanned: service.totalSessionsPlanned,
      totalDelivered: service.totalSessionsDelivered,
      compliancePercentage,
      missedSessions: missedCount,
      canceledSessions: canceledCount,
    };
  }

  /**
   * Get service delivery timeline
   */
  async getDeliveryTimeline(
    serviceId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<Array<{
    date: string;
    status: string;
    minutesDelivered: number;
    provider?: string;
    notes?: string;
  }>> {
    const where: any = { serviceId };

    if (startDate || endDate) {
      where.sessionDate = {};
      if (startDate) where.sessionDate[Op.gte] = startDate;
      if (endDate) where.sessionDate[Op.lte] = endDate;
    }

    const logs = await ServiceLog.findAll({
      where,
      order: [['sessionDate', 'ASC']],
    });

    return logs.map((log) => ({
      date: log.sessionDate.toISOString().split('T')[0],
      status: log.status,
      minutesDelivered: log.minutesDelivered || 0,
      provider: log.provider,
      notes: log.notes,
    }));
  }

  /**
   * Get services by child
   */
  async getServicesByChild(childId: string): Promise<Service[]> {
    return Service.findAll({
      where: { childId, deletedAt: null },
      order: [['startDate', 'DESC']],
    });
  }

  /**
   * Get active services for a child
   */
  async getActiveServices(childId: string): Promise<Service[]> {
    return Service.findAll({
      where: {
        childId,
        status: 'active',
        deletedAt: null,
      },
      order: [['startDate', 'DESC']],
    });
  }

  async assertChildAccess(childId: string, userId: string, role?: string): Promise<void> {
    if (role === 'ADMIN') {
      return;
    }

    const child = await ChildProfile.findByPk(childId, {
      attributes: ['id', 'userId'],
      paranoid: true,
    });

    if (!child || child.userId !== userId) {
      throw new AppError('Access denied', 403, 'FORBIDDEN');
    }
  }

  async assertServiceAccess(serviceId: string, userId: string, role?: string): Promise<void> {
    const service = await Service.findByPk(serviceId, {
      attributes: ['id', 'childId'],
      paranoid: true,
    });

    if (!service) {
      throw new AppError('Service not found', 404, 'SERVICE_NOT_FOUND');
    }

    await this.assertChildAccess(service.childId, userId, role);
  }
}
