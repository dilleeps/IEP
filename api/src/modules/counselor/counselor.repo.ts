import { Op, Transaction } from 'sequelize';
import { getSequelize } from '../../config/sequelize.js';
import { User } from '../auth/user.model.js';
import { ChildProfile } from '../child/child.model.js';
import { IepDocument } from '../document/document.model.js';
import {
  CounselorAvailabilityWindow,
  CounselorAppointment,
  CounselorGoogleToken,
  CounselorProfile,
  CounselorServiceCategory,
  CounselorService,
  CounselorServiceTemplate,
  type CounselorAvailabilityWindowAttributes,
  type CounselorAppointmentAttributes,
  type CounselorGoogleTokenAttributes,
  type CounselorProfileAttributes,
  type CounselorServiceAttributes,
} from './counselor.model.js';
import type {
  CreateCounselorServiceDto,
  ReplaceAvailabilityWindowDto,
  UpdateCounselorAppointmentStatusDto,
  UpdateCounselorProfileDto,
  UpdateCounselorServiceDto,
} from './counselor.types.js';

export class CounselorRepository {
  async findGoogleTokenByUserId(userId: string): Promise<CounselorGoogleToken | null> {
    return CounselorGoogleToken.findOne({
      where: { userId },
    });
  }

  async upsertGoogleToken(userId: string, payload: {
    googleEmail: string | null;
    encryptedAccessToken: string;
    encryptedRefreshToken: string | null;
    scope: string;
    tokenType: string;
    accessTokenExpiresAt: Date | null;
  }): Promise<CounselorGoogleToken> {
    const existing = await this.findGoogleTokenByUserId(userId);
    if (existing) {
      await existing.update(payload as Partial<CounselorGoogleTokenAttributes>);
      return existing;
    }

    return CounselorGoogleToken.create({
      userId,
      ...payload,
    } as CounselorGoogleTokenAttributes);
  }

  async listActiveCounselors(): Promise<User[]> {
    return User.findAll({
      where: { role: 'COUNSELOR', status: 'active' },
      include: [
        {
          model: CounselorProfile,
          as: 'counselorProfile',
          required: false,
        },
      ],
      order: [['displayName', 'ASC']],
    });
  }

  async listCatalogServices(): Promise<CounselorService[]> {
    return CounselorService.findAll({
      order: [
        ['createdAt', 'DESC'],
      ],
      include: [
        {
          model: User,
          as: 'counselor',
          attributes: ['id', 'displayName', 'role', 'status'],
          required: true,
          where: {
            role: 'COUNSELOR',
            status: 'active',
          },
          include: [
            {
              model: CounselorProfile,
              as: 'counselorProfile',
              required: false,
            },
          ],
        },
      ],
    });
  }

  async findServiceById(serviceId: string): Promise<CounselorService | null> {
    return CounselorService.findByPk(serviceId);
  }

  async findChildForParent(parentUserId: string, childId: string): Promise<ChildProfile | null> {
    return ChildProfile.findOne({
      where: {
        id: childId,
        userId: parentUserId,
      },
    });
  }

  async findUserById(userId: string): Promise<User | null> {
    return User.findByPk(userId);
  }

  async createAppointment(
    payload: {
      counselorId: string;
      parentUserId: string;
      childId: string;
      counselorServiceId: string | null;
      iepDocumentId: string | null;
      supportingDocumentIds: string[];
      parentName: string;
      childName: string;
      serviceName: string;
      durationMinutes: number;
      scheduledAt: Date | null;
      notes: string;
      paymentStatus: 'NOT_REQUIRED' | 'PENDING' | 'PAID';
    },
  ): Promise<CounselorAppointment> {
    return CounselorAppointment.create({
      counselorId: payload.counselorId,
      parentUserId: payload.parentUserId,
      childId: payload.childId,
      counselorServiceId: payload.counselorServiceId,
      iepDocumentId: payload.iepDocumentId,
      supportingDocumentIds: payload.supportingDocumentIds,
      parentName: payload.parentName,
      childName: payload.childName,
      serviceName: payload.serviceName,
      durationMinutes: payload.durationMinutes,
      scheduledAt: payload.scheduledAt,
      status: 'REQUESTED',
      paymentStatus: payload.paymentStatus,
      paymentReference: null,
      notes: payload.notes,
      meetLink: null,
      calendarEventId: null,
      counselorMessage: '',
    } as CounselorAppointmentAttributes);
  }

  async findIepDocumentForParentChild(parentUserId: string, childId: string, documentId: string): Promise<IepDocument | null> {
    return IepDocument.findOne({
      where: {
        id: documentId,
        userId: parentUserId,
        childId,
      },
    });
  }

  async listAcceptedAppointmentsForCounselor(
    counselorId: string,
    dayStart: Date,
    dayEnd: Date,
    excludeAppointmentId?: string,
  ): Promise<CounselorAppointment[]> {
    const where: Record<string, unknown> = {
      counselorId,
      status: 'ACCEPTED',
      scheduledAt: {
        [Op.gte]: dayStart,
        [Op.lt]: dayEnd,
      },
    };

    if (excludeAppointmentId) {
      where.id = {
        [Op.ne]: excludeAppointmentId,
      };
    }

    return CounselorAppointment.findAll({
      where,
      order: [['scheduledAt', 'ASC']],
    });
  }

  async listAppointmentsByParent(parentUserId: string): Promise<CounselorAppointment[]> {
    return CounselorAppointment.findAll({
      where: { parentUserId },
      order: [
        ['createdAt', 'DESC'],
      ],
    });
  }

  async findAppointmentByParent(parentUserId: string, appointmentId: string): Promise<CounselorAppointment | null> {
    return CounselorAppointment.findOne({
      where: {
        id: appointmentId,
        parentUserId,
      },
    });
  }

  async updateAppointmentByParent(
    parentUserId: string,
    appointmentId: string,
    payload: Partial<CounselorAppointmentAttributes>,
  ): Promise<CounselorAppointment | null> {
    const item = await this.findAppointmentByParent(parentUserId, appointmentId);
    if (!item) {
      return null;
    }

    await item.update(payload as Partial<CounselorAppointmentAttributes>);
    return item;
  }

  async findAppointmentByCounselor(counselorId: string, appointmentId: string): Promise<CounselorAppointment | null> {
    return CounselorAppointment.findOne({
      where: {
        id: appointmentId,
        counselorId,
      },
    });
  }

  async updateAppointmentByCounselor(
    counselorId: string,
    appointmentId: string,
    payload: Partial<CounselorAppointmentAttributes>,
  ): Promise<CounselorAppointment | null> {
    const item = await this.findAppointmentByCounselor(counselorId, appointmentId);
    if (!item) {
      return null;
    }

    await item.update(payload as Partial<CounselorAppointmentAttributes>);
    return item;
  }

  async markAppointmentPaidByParent(
    parentUserId: string,
    appointmentId: string,
    payload: { paymentReference: string },
  ): Promise<CounselorAppointment | null> {
    const item = await this.findAppointmentByParent(parentUserId, appointmentId);
    if (!item) {
      return null;
    }

    await item.update({
      paymentStatus: 'PAID',
      paymentReference: payload.paymentReference,
    } as Partial<CounselorAppointmentAttributes>);

    return item;
  }

  async getServiceMetadata(): Promise<{
    categories: CounselorServiceCategory[];
    templates: CounselorServiceTemplate[];
  }> {
    const [categories, templates] = await Promise.all([
      CounselorServiceCategory.findAll({
        where: { isActive: true },
        order: [
          ['sortOrder', 'ASC'],
          ['department', 'ASC'],
        ],
      }),
      CounselorServiceTemplate.findAll({
        where: { isActive: true },
        order: [
          ['sortOrder', 'ASC'],
          ['name', 'ASC'],
        ],
      }),
    ]);

    return { categories, templates };
  }

  async listServices(counselorId: string): Promise<CounselorService[]> {
    return CounselorService.findAll({
      where: { counselorId },
      order: [
        ['createdAt', 'DESC'],
      ],
    });
  }

  async createService(counselorId: string, payload: CreateCounselorServiceDto): Promise<CounselorService> {
    return CounselorService.create({
      counselorId,
      ...payload,
    } as CounselorServiceAttributes);
  }

  async updateService(
    counselorId: string,
    serviceId: string,
    payload: UpdateCounselorServiceDto,
  ): Promise<CounselorService | null> {
    const item = await CounselorService.findOne({
      where: {
        id: serviceId,
        counselorId,
      },
    });

    if (!item) {
      return null;
    }

    await item.update(payload);
    return item;
  }

  async deleteService(counselorId: string, serviceId: string): Promise<number> {
    return CounselorService.destroy({
      where: {
        id: serviceId,
        counselorId,
      },
    });
  }

  async listAvailability(counselorId: string): Promise<CounselorAvailabilityWindow[]> {
    return CounselorAvailabilityWindow.findAll({
      where: { counselorId },
      order: [
        ['day', 'ASC'],
        ['startTime', 'ASC'],
      ],
    });
  }

  async replaceAvailability(
    counselorId: string,
    windows: ReplaceAvailabilityWindowDto[],
  ): Promise<CounselorAvailabilityWindow[]> {
    const sequelize = getSequelize();

    return sequelize.transaction(async (tx: Transaction) => {
      await CounselorAvailabilityWindow.destroy({
        where: { counselorId },
        transaction: tx,
      });

      if (windows.length > 0) {
        await CounselorAvailabilityWindow.bulkCreate(
          windows.map((window) => ({
            counselorId,
            day: window.day,
            startTime: window.startTime,
            endTime: window.endTime,
            label: window.label || '',
          })) as CounselorAvailabilityWindowAttributes[],
          { transaction: tx },
        );
      }

      return CounselorAvailabilityWindow.findAll({
        where: { counselorId },
        order: [
          ['day', 'ASC'],
          ['startTime', 'ASC'],
        ],
        transaction: tx,
      });
    });
  }

  async findOrCreateProfile(userId: string): Promise<CounselorProfile> {
    const [profile] = await CounselorProfile.findOrCreate({
      where: { userId },
      defaults: {
        userId,
      } as CounselorProfileAttributes,
    });

    return profile;
  }

  async updateProfile(userId: string, payload: UpdateCounselorProfileDto): Promise<CounselorProfile> {
    const profile = await this.findOrCreateProfile(userId);
    await profile.update(payload);
    return profile;
  }

  async listAppointments(counselorId: string): Promise<CounselorAppointment[]> {
    return CounselorAppointment.findAll({
      where: { counselorId },
      order: [
        ['scheduledAt', 'DESC'],
        ['createdAt', 'DESC'],
      ],
    });
  }

  async updateAppointmentStatus(
    counselorId: string,
    appointmentId: string,
    payload: UpdateCounselorAppointmentStatusDto,
  ): Promise<CounselorAppointment | null> {
    const item = await this.findAppointmentByCounselor(counselorId, appointmentId);

    if (!item) {
      return null;
    }

    await item.update(payload as Partial<CounselorAppointmentAttributes>);
    return item;
  }
}
