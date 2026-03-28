// src/modules/advocacy/advocacy.controller.ts
import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/authenticate.js';
import { AdvocacyService } from './advocacy.service.js';
import { AdvocacyInsightResponse, SimilarCaseResponse, AdvocacyStatsResponse } from './advocacy.types.js';

export class AdvocacyController {
  private service: AdvocacyService;

  constructor() {
    this.service = new AdvocacyService();
  }

  create = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const insight = await this.service.create(req.user!.id, req.body);
      res.status(201).json(this.toInsightResponse(insight));
    } catch (error) {
      next(error);
    }
  };

  generate = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const insight = await this.service.generate(req.user!.id, req.body);
      res.status(201).json(this.toInsightResponse(insight));
    } catch (error) {
      next(error);
    }
  };

  searchSimilar = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const results = await this.service.searchSimilarCases(req.body);
      
      const response: { cases: SimilarCaseResponse[] } = {
        cases: results.map(r => ({
          id: r.id,
          content: r.content,
          similarity: r.similarity,
          metadata: r.metadata,
        })),
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  list = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { childId, priority, status, category } = req.query;
      
      // Only pass filters if at least one is defined
      const filters: any = {};
      if (childId) filters.childId = childId as string;
      if (priority) filters.priority = priority as string;
      if (status) filters.status = status as string;
      if (category) filters.category = category as string;
      
      const insights = await this.service.findByUserId(
        req.user!.id,
        Object.keys(filters).length > 0 ? filters : undefined
      );

      res.json({
        insights: insights.map(i => this.toInsightResponse(i)),
      });
    } catch (error) {
      next(error);
    }
  };

  getActive = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const insights = await this.service.findActive(req.user!.id);
      
      res.json({
        insights: insights.map(i => this.toInsightResponse(i)),
      });
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const insight = await this.service.findById(req.params.id);
      
      // Verify ownership
      if (req.user?.role !== 'ADMIN' && insight.userId !== req.user!.id) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      res.json(this.toInsightResponse(insight));
    } catch (error) {
      next(error);
    }
  };

  update = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const insight = await this.service.findById(req.params.id);
      
      // Verify ownership
      if (req.user?.role !== 'ADMIN' && insight.userId !== req.user!.id) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const updated = await this.service.update(req.params.id, req.body);
      res.json(this.toInsightResponse(updated));
    } catch (error) {
      next(error);
    }
  };

  updateStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const insight = await this.service.findById(req.params.id);
      
      // Verify ownership
      if (req.user?.role !== 'ADMIN' && insight.userId !== req.user!.id) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const updated = await this.service.updateStatus(req.params.id, req.body.status);
      res.json(this.toInsightResponse(updated));
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const insight = await this.service.findById(req.params.id);
      
      // Verify ownership
      if (req.user?.role !== 'ADMIN' && insight.userId !== req.user!.id) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      await this.service.softDelete(req.params.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };

  getStatsByChild = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const stats = await this.service.getStatsByChild(req.params.childId);
      
      const response: AdvocacyStatsResponse = {
        total: stats.total,
        byPriority: stats.byPriority,
        byCategory: stats.byCategory,
        byStatus: stats.byStatus,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  // Meeting Simulation Endpoints (Advocacy Lab)
  simulateMeeting = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { userMessage, childContext } = req.body;
      const response = await this.service.simulateMeeting(userMessage, childContext);
      res.json({ response });
    } catch (error) {
      next(error);
    }
  };

  createSession = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { scenarioType, goal, childId } = req.body;
      const session = await this.service.createAdvocacySession(
        req.user!.id,
        childId,
        scenarioType || 'iep_meeting',
        goal || 'Refine Legal Negotiation'
      );
      res.status(201).json({ session });
    } catch (error) {
      next(error);
    }
  };

  sendMessage = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { sessionId } = req.params;
      const { message, childContext } = req.body;
      const response = await this.service.sendSessionMessage(
        sessionId,
        req.user!.id,
        message,
        childContext
      );
      res.json({ response });
    } catch (error) {
      next(error);
    }
  };

  getSession = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { sessionId } = req.params;
      const session = await this.service.getAdvocacySession(sessionId, req.user!.id);
      res.json({ session });
    } catch (error) {
      next(error);
    }
  };

  deleteSession = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { sessionId } = req.params;
      await this.service.deleteAdvocacySession(sessionId, req.user!.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };

  getQuickPrompts = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const prompts = [
        "I disagree with this placement.",
        "Can we request an IEE?",
        "I want to see the data.",
        "Is this a FAPE violation?",
        "I need 1:1 aide support.",
        "This goal is too vague.",
        "What accommodations are available?",
        "Can we add more speech therapy hours?",
        "I want this documented in writing.",
        "When can we schedule a follow-up meeting?"
      ];
      res.json({ prompts });
    } catch (error) {
      next(error);
    }
  };

  private toInsightResponse(insight: any): AdvocacyInsightResponse {
    return {
      id: insight.id,
      childId: insight.childId,
      priority: insight.priority,
      category: insight.category,
      title: insight.title,
      description: insight.description,
      actionItems: insight.actionItems,
      status: insight.status,
      acknowledgedAt: insight.acknowledgedAt?.toISOString(),
      dismissedAt: insight.dismissedAt?.toISOString(),
      triggerType: insight.triggerType,
      triggerData: insight.triggerData,
      aiGenerated: insight.aiGenerated,
      aiConfidenceScore: insight.aiConfidenceScore,
      createdAt: insight.createdAt.toISOString(),
    };
  }
}
