// src/modules/admin/analytics/admin-analytics.controller.ts
import type { Response, NextFunction } from 'express';
import type { AuthRequest } from '../../../middleware/authenticate.js';
import { AdminAnalyticsService } from './admin-analytics.service.js';
import { analyticsQuerySchema } from './admin-analytics.validation.js';

export class AdminAnalyticsController {
  private service: AdminAnalyticsService;

  constructor() {
    this.service = new AdminAnalyticsService();
  }

  getUserAnalytics = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const query = analyticsQuerySchema.parse(req.query);
      const data = await this.service.getUserAnalytics(query);
      res.json(data);
    } catch (error) {
      next(error);
    }
  };
}
