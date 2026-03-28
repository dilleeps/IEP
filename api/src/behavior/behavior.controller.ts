// src/modules/behavior/behavior.controller.ts
import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/authenticate.js';
import { BehaviorService } from './behavior.service.js';
import { BehaviorLogResponse, BehaviorPatternResponse } from './behavior.types.js';

export class BehaviorController {
  private service: BehaviorService;

  constructor() {
    this.service = new BehaviorService();
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
      const { childId, startDate, endDate, minSeverity } = req.query;
      
      const logs = await this.service.findByUserId(req.user!.id, {
        childId: childId as string,
        startDate: startDate as string,
        endDate: endDate as string,
        minSeverity: minSeverity ? parseInt(minSeverity as string) : undefined,
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

  getPatternAnalysis = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const days = req.query.days ? parseInt(req.query.days as string) : 30;
      const analysis = await this.service.getPatternAnalysis(req.params.childId, days);
      
      const response: BehaviorPatternResponse = {
        total: analysis.total,
        byType: analysis.byType,
        averageSeverity: analysis.averageSeverity,
        commonTriggers: analysis.commonTriggers,
        effectiveInterventions: analysis.effectiveInterventions,
        timePatterns: analysis.timePatterns,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  private toLogResponse(log: any): BehaviorLogResponse {
    return {
      id: log.id,
      childId: log.childId,
      date: log.eventDate || log.date,
      behaviorType: log.behavior || log.behaviorType,
      description: log.description || '',
      context: log.antecedent,
      interventions: log.consequence,
      severity: log.intensity,
      location: log.location || undefined,
      witnesses: log.witnesses || [],
      tags: log.tags || [],
      createdAt: log.createdAt?.toISOString?.() || log.createdAt,
    };
  }
}
