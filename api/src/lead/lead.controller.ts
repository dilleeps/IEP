import { Request, Response, NextFunction } from 'express';
import { LeadService } from './lead.service.js';
import { logger } from '../config/logger.js';

export class LeadController {
  private leadService: LeadService;

  constructor() {
    this.leadService = new LeadService();
  }

  /**
   * Create new lead (public endpoint with reCAPTCHA)
   * POST /api/v1/leads
   */
  createLead = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ip = req.ip || req.headers['x-forwarded-for'] as string || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'];

      const lead = await this.leadService.createLead(req.body, ip, userAgent);

      // Async notification (don't wait for it)
      this.sendNotifications(lead).catch(err => {
        logger.error('Failed to send lead notifications', { error: err });
      });

      res.status(200).json({
        status: 'ok',
        message: 'Lead recorded successfully',
        data: lead,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * List leads (admin only)
   * GET /api/v1/leads
   */
  listLeads = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const format = (req.query.format as string) || 'json';

      const result = await this.leadService.listLeads(limit, offset);

      // Return CSV format if requested
      if (format === 'csv') {
        const csv = this.leadService.generateLeadsCSV(result.leads);
        const filename = `leads_${new Date().toISOString().split('T')[0]}.csv`;
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        return res.send(csv);
      }

      // Return JSON format
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Send notifications for new lead (async)
   * This can be extended to send Telegram/Email notifications
   */
  private async sendNotifications(lead: any): Promise<void> {
    try {
      const totalLeads = await this.leadService.getLeadCount();
      const recentLeads = await this.leadService.getRecentLeads(10);

      logger.info('New lead created', {
        leadId: lead.id,
        email: lead.email,
        totalLeads,
        recentCount: recentLeads.length,
      });

      // TODO: Implement Telegram notification
      // await this.sendTelegramNotification(lead, totalLeads, recentLeads);

      // TODO: Implement Email notification
      // await this.sendEmailNotification(lead, totalLeads, recentLeads);
    } catch (error) {
      logger.error('Error sending lead notifications', { error });
    }
  }

  /**
   * Get lead statistics (admin only)
   * GET /api/v1/leads/stats
   */
  getLeadStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const totalLeads = await this.leadService.getLeadCount();
      const recentLeads = await this.leadService.getRecentLeads(10);

      res.json({
        totalLeads,
        recentCount: recentLeads.length,
        recentLeads,
      });
    } catch (error) {
      next(error);
    }
  };
}
