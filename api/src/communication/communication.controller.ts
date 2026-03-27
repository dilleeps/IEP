// src/modules/communication/communication.controller.ts
import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/authenticate.js';
import { CommunicationService } from './communication.service.js';
import { CommunicationLogResponse, CommunicationStatsResponse } from './communication.types.js';

export class CommunicationController {
  private service: CommunicationService;

  constructor() {
    this.service = new CommunicationService();
  }

  create = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const log = await this.service.create(req.user!.id, req.body);
      res.status(201).json(this.toLogResponse(log));
    } catch (error) {
      next(error);
    }
  };

  list = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { childId, contactType, followUpRequired, startDate, endDate } = req.query;
      
      const logs = await this.service.findByUserId(req.user!.id, {
        childId: childId as string,
        contactType: contactType as string,
        followUpRequired: followUpRequired === 'true' ? true : followUpRequired === 'false' ? false : undefined,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
      });

      res.json({
        logs: logs.map(l => this.toLogResponse(l)),
      });
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const log = await this.service.findById(req.params.id);
      
      // Verify ownership
      if (req.user?.role !== 'ADMIN' && log.userId !== req.user!.id) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      res.json(this.toLogResponse(log));
    } catch (error) {
      next(error);
    }
  };

  getByChildId = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const logs = await this.service.findByChildId(req.params.childId);
      
      // Verify at least one log belongs to user
      if (req.user?.role !== 'ADMIN' && logs.length > 0 && logs[0].userId !== req.user!.id) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      res.json({
        logs: logs.map(l => this.toLogResponse(l)),
      });
    } catch (error) {
      next(error);
    }
  };

  update = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const log = await this.service.findById(req.params.id);
      
      // Verify ownership
      if (req.user?.role !== 'ADMIN' && log.userId !== req.user!.id) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const updated = await this.service.update(req.params.id, req.body);
      res.json(this.toLogResponse(updated));
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const log = await this.service.findById(req.params.id);
      
      // Verify ownership
      if (req.user?.role !== 'ADMIN' && log.userId !== req.user!.id) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      await this.service.softDelete(req.params.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };

  getFollowUps = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const logs = await this.service.getFollowUpsRequired(req.user!.id);
      res.json({
        logs: logs.map(l => this.toLogResponse(l)),
      });
    } catch (error) {
      next(error);
    }
  };

  getStats = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const stats = await this.service.getStatsByChild(req.params.childId);
      
      const response: CommunicationStatsResponse = {
        total: stats.total,
        byType: stats.byType,
        recentCount: stats.recentCount,
        followUpsPending: stats.followUpsPending,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  private toLogResponse(log: any): CommunicationLogResponse {
    return {
      id: log.id,
      childId: log.childId || undefined,
      date: log.date, // DATEONLY is already a string
      contactType: log.contactType,
      contactWith: log.contactWith,
      contactRole: log.contactRole || undefined,
      subject: log.subject,
      summary: log.summary,
      followUpRequired: log.followUpRequired,
      followUpDate: log.followUpDate || undefined, // DATEONLY is already a string
      attachments: log.attachments || [],
      createdAt: log.createdAt?.toISOString?.() || log.createdAt,
    };
  }
}
