import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/authenticate.js';
import { ConsultationService } from './consultation.service.js';
import type {
  ConsultationResponse,
  ConsultationSlotResponse,
} from './consultation.types.js';

function normalizeTime(value: string): string {
  return value.slice(0, 5);
}

export class ConsultationController {
  private service: ConsultationService;

  constructor() {
    this.service = new ConsultationService();
  }

  // ─── Slots ────────────────────────────────────────────────────────────────

  listAvailableSlots = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const slots = await this.service.listAvailableSlots(req.query as any);
      res.json({
        slots: slots.map((s) => this.toSlotResponse(s)),
      });
    } catch (error) {
      next(error);
    }
  };

  createSlot = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const slot = await this.service.createSlot(req.body);
      res.status(201).json(this.toSlotResponse(slot));
    } catch (error) {
      next(error);
    }
  };

  createSlotsBulk = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const slots = await this.service.createSlotsBulk(req.body.slots);
      res.status(201).json({
        slots: slots.map((s) => this.toSlotResponse(s)),
      });
    } catch (error) {
      next(error);
    }
  };

  deleteSlot = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      await this.service.deleteSlot(req.params.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };

  // ─── Parent Booking ───────────────────────────────────────────────────────

  bookConsultation = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const consultation = await this.service.bookConsultation(req.user!.id, req.body);
      res.status(201).json(this.toConsultationResponse(consultation));
    } catch (error) {
      next(error);
    }
  };

  listMyConsultations = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const consultations = await this.service.listMyConsultations(req.user!.id);
      res.json({
        consultations: consultations.map((c) => this.toConsultationResponse(c)),
      });
    } catch (error) {
      next(error);
    }
  };

  cancelMyConsultation = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const consultation = await this.service.cancelMyConsultation(req.user!.id, req.params.id);
      res.json(this.toConsultationResponse(consultation));
    } catch (error) {
      next(error);
    }
  };

  // ─── Admin ────────────────────────────────────────────────────────────────

  listAllConsultations = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const status = req.query.status as string | undefined;
      const consultations = await this.service.listAllConsultations(status);
      res.json({
        consultations: consultations.map((c) => this.toConsultationResponse(c)),
      });
    } catch (error) {
      next(error);
    }
  };

  updateConsultation = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const consultation = await this.service.updateConsultation(req.params.id, req.body);
      res.json(this.toConsultationResponse(consultation));
    } catch (error) {
      next(error);
    }
  };

  // ─── Response Mappers ─────────────────────────────────────────────────────

  private toSlotResponse(item: any): ConsultationSlotResponse {
    return {
      id: item.id,
      date: item.date,
      startTime: normalizeTime(item.startTime),
      endTime: normalizeTime(item.endTime),
      durationMinutes: item.durationMinutes,
      isAvailable: item.isAvailable,
    };
  }

  private toConsultationResponse(item: any): ConsultationResponse {
    return {
      id: item.id,
      parentUserId: item.parentUserId,
      childId: item.childId,
      slotId: item.slotId,
      parentName: item.parentName,
      parentEmail: item.parentEmail,
      childName: item.childName,
      concernArea: item.concernArea,
      notes: item.notes || '',
      status: item.status,
      meetLink: item.meetLink || null,
      expertNotes: item.expertNotes || '',
      slot: item.slot ? this.toSlotResponse(item.slot) : null,
      createdAt: new Date(item.createdAt).toISOString(),
      updatedAt: new Date(item.updatedAt).toISOString(),
      cancelledAt: item.cancelledAt ? new Date(item.cancelledAt).toISOString() : null,
    };
  }
}
