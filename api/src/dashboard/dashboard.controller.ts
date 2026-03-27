// src/modules/dashboard/dashboard.controller.ts
import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/authenticate.js';
import { DashboardService } from './dashboard.service.js';

export class DashboardController {
  private service: DashboardService;

  constructor() {
    this.service = new DashboardService();
  }

  getSummary = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const summary = await this.service.getSummary(req.user!.id, req.user!.role);
      res.json(summary);
    } catch (error) {
      next(error);
    }
  };

  getOverview = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { childId } = req.query;

      if (!childId || typeof childId !== 'string') {
        return res.status(400).json({ error: 'childId query parameter is required' });
      }

      const overview = await this.service.getOverview(req.user!.id, childId);
      res.json({ success: true, data: overview });
    } catch (error) {
      next(error);
    }
  };
}
