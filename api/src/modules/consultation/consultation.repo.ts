import { Op, Transaction } from 'sequelize';
import { getSequelize } from '../../config/sequelize.js';
import { User } from '../auth/user.model.js';
import { ChildProfile } from '../child/child.model.js';
import {
  ExpertConsultation,
  ExpertConsultationSlot,
  type ExpertConsultationAttributes,
  type ExpertConsultationSlotAttributes,
} from './consultation.model.js';
import type { ConsultationStatus } from './consultation.types.js';

export class ConsultationRepository {
  /**
   * Find available slots for a given date range.
   * Only returns slots that are NOT already booked (is_available = true)
   * and whose date is in the future or today.
   */
  async listAvailableSlots(options: {
    date?: string;
    from?: string;
    to?: string;
  }): Promise<ExpertConsultationSlot[]> {
    const where: Record<string, unknown> = {
      isAvailable: true,
    };

    if (options.date) {
      where.date = options.date;
    } else if (options.from || options.to) {
      const dateFilter: Record<symbol, string> = {};
      if (options.from) dateFilter[Op.gte] = options.from;
      if (options.to) dateFilter[Op.lte] = options.to;
      where.date = dateFilter;
    } else {
      // Default: today and future
      const today = new Date().toISOString().split('T')[0];
      where.date = { [Op.gte]: today };
    }

    return ExpertConsultationSlot.findAll({
      where,
      order: [
        ['date', 'ASC'],
        ['startTime', 'ASC'],
      ],
    });
  }

  async findSlotById(slotId: string): Promise<ExpertConsultationSlot | null> {
    return ExpertConsultationSlot.findByPk(slotId);
  }

  /** Find all booked (unavailable) slots for a given date */
  async listBookedSlotsForDate(date: string): Promise<ExpertConsultationSlot[]> {
    return ExpertConsultationSlot.findAll({
      where: {
        date,
        isAvailable: false,
      },
      order: [['startTime', 'ASC']],
    });
  }

  /** Find a slot by date and start time (for checking if auto-slot already exists in DB) */
  async findSlotByDateTime(date: string, startTime: string): Promise<ExpertConsultationSlot | null> {
    return ExpertConsultationSlot.findOne({
      where: { date, startTime },
    });
  }

  /**
   * Atomically book a slot: marks it unavailable and creates the consultation
   * inside a transaction to prevent double bookings.
   */
  async bookSlot(
    slotId: string,
    payload: {
      parentUserId: string;
      childId: string;
      parentName: string;
      parentEmail: string;
      childName: string;
      concernArea: string;
      notes: string;
    },
  ): Promise<ExpertConsultation> {
    const sequelize = getSequelize();

    return sequelize.transaction(async (tx: Transaction) => {
      // Lock the slot row for update to prevent race conditions
      const slot = await ExpertConsultationSlot.findOne({
        where: {
          id: slotId,
          isAvailable: true,
        },
        lock: tx.LOCK.UPDATE,
        transaction: tx,
      });

      if (!slot) {
        throw new Error('SLOT_UNAVAILABLE');
      }

      // Mark slot as unavailable
      await slot.update({ isAvailable: false }, { transaction: tx });

      // Remove any cancelled consultation for this slot (unique constraint on slot_id)
      await ExpertConsultation.destroy({
        where: { slotId, status: 'CANCELLED' },
        transaction: tx,
      });

      // Create the consultation booking
      const consultation = await ExpertConsultation.create(
        {
          parentUserId: payload.parentUserId,
          childId: payload.childId,
          slotId,
          parentName: payload.parentName,
          parentEmail: payload.parentEmail,
          childName: payload.childName,
          concernArea: payload.concernArea,
          notes: payload.notes,
          status: 'BOOKED',
          meetLink: null,
          expertNotes: '',
          cancelledAt: null,
        } as ExpertConsultationAttributes,
        { transaction: tx },
      );

      return consultation;
    });
  }

  async createSlot(payload: {
    date: string;
    startTime: string;
    endTime: string;
    durationMinutes: number;
  }): Promise<ExpertConsultationSlot> {
    return ExpertConsultationSlot.create({
      date: payload.date,
      startTime: payload.startTime,
      endTime: payload.endTime,
      durationMinutes: payload.durationMinutes,
      isAvailable: true,
    } as ExpertConsultationSlotAttributes);
  }

  async createSlotsBulk(slots: Array<{
    date: string;
    startTime: string;
    endTime: string;
    durationMinutes: number;
  }>): Promise<ExpertConsultationSlot[]> {
    return ExpertConsultationSlot.bulkCreate(
      slots.map((s) => ({
        date: s.date,
        startTime: s.startTime,
        endTime: s.endTime,
        durationMinutes: s.durationMinutes,
        isAvailable: true,
      })) as ExpertConsultationSlotAttributes[],
    );
  }

  async deleteSlot(slotId: string): Promise<number> {
    // Only allow deleting available (unbooked) slots
    return ExpertConsultationSlot.destroy({
      where: {
        id: slotId,
        isAvailable: true,
      },
    });
  }

  async listConsultationsByParent(parentUserId: string): Promise<ExpertConsultation[]> {
    return ExpertConsultation.findAll({
      where: { parentUserId },
      include: [
        {
          model: ExpertConsultationSlot,
          as: 'slot',
          required: false,
        },
      ],
      order: [['createdAt', 'DESC']],
    });
  }

  async findConsultationByParent(parentUserId: string, consultationId: string): Promise<ExpertConsultation | null> {
    return ExpertConsultation.findOne({
      where: {
        id: consultationId,
        parentUserId,
      },
      include: [
        {
          model: ExpertConsultationSlot,
          as: 'slot',
          required: false,
        },
      ],
    });
  }

  async findConsultationById(consultationId: string): Promise<ExpertConsultation | null> {
    return ExpertConsultation.findByPk(consultationId, {
      include: [
        {
          model: ExpertConsultationSlot,
          as: 'slot',
          required: false,
        },
      ],
    });
  }

  /**
   * Cancel a consultation and release the slot back to available.
   */
  async cancelConsultation(consultationId: string, parentUserId: string): Promise<ExpertConsultation | null> {
    const sequelize = getSequelize();

    return sequelize.transaction(async (tx: Transaction) => {
      const consultation = await ExpertConsultation.findOne({
        where: {
          id: consultationId,
          parentUserId,
          status: { [Op.in]: ['BOOKED', 'CONFIRMED'] },
        },
        lock: tx.LOCK.UPDATE,
        transaction: tx,
      });

      if (!consultation) {
        return null;
      }

      await consultation.update(
        {
          status: 'CANCELLED' as ConsultationStatus,
          cancelledAt: new Date(),
        },
        { transaction: tx },
      );

      // Release the slot back to available
      await ExpertConsultationSlot.update(
        { isAvailable: true },
        {
          where: { id: consultation.slotId },
          transaction: tx,
        },
      );

      // Re-fetch with slot
      return ExpertConsultation.findByPk(consultationId, {
        include: [{ model: ExpertConsultationSlot, as: 'slot', required: false }],
        transaction: tx,
      });
    });
  }

  /** Admin: list all consultations */
  async listAllConsultations(status?: ConsultationStatus): Promise<ExpertConsultation[]> {
    const where: Record<string, unknown> = {};
    if (status) {
      where.status = status;
    }

    return ExpertConsultation.findAll({
      where,
      include: [
        {
          model: ExpertConsultationSlot,
          as: 'slot',
          required: false,
        },
      ],
      order: [['createdAt', 'DESC']],
    });
  }

  /** Admin: update consultation (status, expert notes, meet link) */
  async updateConsultation(
    consultationId: string,
    payload: Partial<ExpertConsultationAttributes>,
  ): Promise<ExpertConsultation | null> {
    const item = await ExpertConsultation.findByPk(consultationId);
    if (!item) return null;

    await item.update(payload);

    return ExpertConsultation.findByPk(consultationId, {
      include: [{ model: ExpertConsultationSlot, as: 'slot', required: false }],
    });
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

  /** Check if parent already has an active consultation for the same slot date */
  async findActiveConsultationForParentOnDate(parentUserId: string, date: string): Promise<ExpertConsultation | null> {
    return ExpertConsultation.findOne({
      where: {
        parentUserId,
        status: { [Op.in]: ['BOOKED', 'CONFIRMED'] },
      },
      include: [
        {
          model: ExpertConsultationSlot,
          as: 'slot',
          required: true,
          where: { date },
        },
      ],
    });
  }
}
