// src/modules/compliance/compliance.controller.ts
import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/authenticate.js';
import { ComplianceService } from './compliance.service.js';
import { ComplianceLogResponse, ComplianceSummaryResponse } from './compliance.types.js';

export class ComplianceController {
  private service: ComplianceService;

  constructor() {
    this.service = new ComplianceService();
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
      const { childId, status, issueReported } = req.query;
      
      const logs = await this.service.findByUserId(req.user!.id, {
        childId: childId as string,
        status: status as string,
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

  updateStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const log = await this.service.findById(req.params.id);
      
      // Verify ownership
      if (req.user?.role !== 'ADMIN' && log.userId !== req.user!.id) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const updated = await this.service.updateStatus(req.params.id, req.body);
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

  getSummary = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const summary = await this.service.getSummary(req.params.childId);
      
      const response: ComplianceSummaryResponse = {
        childId: summary.childId,
        totalIssues: summary.totalIssues || 0,
        openIssues: summary.openIssues || 0,
        resolvedIssues: summary.resolvedIssues || 0,
        criticalIssues: summary.criticalIssues || 0,
        complianceScore: Number(summary.complianceScore || 0),
        lastCalculated: (summary.createdAt || new Date()).toISOString(),
        issueBreakdown: summary.issueBreakdown || {},
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  regenerateSummary = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const summary = await this.service.regenerateSummary(req.params.childId);
      
      const response: ComplianceSummaryResponse = {
        childId: summary.childId,
        totalIssues: summary.totalIssues || 0,
        openIssues: summary.openIssues || 0,
        resolvedIssues: summary.resolvedIssues || 0,
        criticalIssues: summary.criticalIssues || 0,
        complianceScore: Number(summary.complianceScore || 0),
        lastCalculated: (summary.createdAt || new Date()).toISOString(),
        issueBreakdown: summary.issueBreakdown || {},
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  private toLogResponse(log: any): ComplianceLogResponse {
    return {
      id: log.id,
      childId: log.childId,
      serviceDate: log.serviceDate?.toISOString?.() || log.serviceDate,
      serviceType: log.serviceType,
      serviceProvider: log.serviceProvider,
      status: log.status,
      minutesProvided: log.minutesProvided,
      minutesRequired: log.minutesRequired,
      notes: log.notes,
      attachments: log.attachments,
      issueReported: log.issueReported,
      resolutionStatus: log.resolutionStatus,
      createdAt: log.createdAt.toISOString(),
    };
  }
}
