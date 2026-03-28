// src/modules/goal/goal.controller.ts
import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/authenticate.js';
import { GoalService } from './goal.service.js';
import { GoalResponse, GoalSummaryResponse } from './goal.types.js';

export class GoalController {
  private service: GoalService;

  constructor() {
    this.service = new GoalService();
  }

  create = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      console.log('🎯 Goal create called with body:', JSON.stringify(req.body, null, 2));
      console.log('🎯 User ID:', req.user?.id);
      
      const goal = await this.service.create(req.user!.id, req.body);
      
      console.log('🎯 Goal created successfully:', goal.id);
      console.log('🎯 Goal data:', JSON.stringify(goal.toJSON(), null, 2));
      
      res.status(201).json(this.toGoalResponse(goal));
    } catch (error) {
      console.error('❌ Goal create error:', error);
      next(error);
    }
  };

  list = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { childId, category, status } = req.query;
      
      console.log('📋 Goals list called with filters:', { childId, category, status, userId: req.user?.id });
      
      const goals = await this.service.findByUserId(req.user!.id, {
        childId: childId as string,
        category: category as string,
        status: status as string,
      });

      console.log('📋 Goals found:', goals.length, 'goals');
      console.log('📋 Goal IDs:', goals.map(g => g.id));

      res.json({
        goals: goals.map(g => this.toGoalResponse(g)),
      });
    } catch (error) {
      console.error('❌ Goals list error:', error);
      next(error);
    }
  };

  getById = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const goal = await this.service.findById(req.params.id);
      
      // Verify ownership
      if (req.user?.role !== 'ADMIN' && goal.userId !== req.user!.id) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      res.json(this.toGoalResponse(goal));
    } catch (error) {
      next(error);
    }
  };

  getByChildId = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const goals = await this.service.findByChildId(req.params.childId);
      
      // Verify at least one goal belongs to user (or check child ownership separately)
      if (req.user?.role !== 'ADMIN' && goals.length > 0 && goals[0].userId !== req.user!.id) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      res.json({
        goals: goals.map(g => this.toGoalResponse(g)),
      });
    } catch (error) {
      next(error);
    }
  };

  update = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const goal = await this.service.findById(req.params.id);
      
      // Verify ownership
      if (req.user?.role !== 'ADMIN' && goal.userId !== req.user!.id) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const updated = await this.service.update(req.params.id, req.body);
      res.json(this.toGoalResponse(updated));
    } catch (error) {
      next(error);
    }
  };

  updateProgress = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const goal = await this.service.findById(req.params.id);
      
      // Verify ownership
      if (req.user?.role !== 'ADMIN' && goal.userId !== req.user!.id) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const updated = await this.service.updateProgress(req.params.id, req.body);
      res.json(this.toGoalResponse(updated));
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const goal = await this.service.findById(req.params.id);
      
      // Verify ownership
      if (req.user?.role !== 'ADMIN' && goal.userId !== req.user!.id) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      await this.service.softDelete(req.params.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };

  getProgressSummary = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const summary = await this.service.getProgressSummary(req.params.childId);
      
      const response: GoalSummaryResponse = {
        total: summary.total,
        byStatus: summary.byStatus,
        byCategory: summary.byCategory,
        averageProgress: summary.averageProgress,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  private toGoalResponse(goal: any): GoalResponse {
    const domain = goal.domain || goal.category || 'other';
    // Fall back to IEP document dates when goal-level dates are missing.
    // This ensures the progress bar calculates expected progress from the IEP period.
    const doc = goal.document;
    const startDate = goal.startDate || doc?.iepStartDate;
    const targetDate = goal.targetDate || doc?.iepEndDate;
    return {
      id: goal.id,
      childId: goal.childId,
      goalText: goal.goalText || goal.goalName || '',
      goalName: goal.goalName,
      domain,
      category: domain, // backward-compat
      baseline: goal.baseline,
      target: goal.target,
      currentValue: goal.currentValue,
      targetValue: goal.targetValue,
      targetDate: targetDate?.toISOString?.() || targetDate || undefined,
      startDate: startDate?.toISOString?.() || startDate || undefined,
      status: goal.status,
      progressPercentage: goal.progressPercentage != null ? Number(goal.progressPercentage) : 0,
      notes: goal.notes,
      milestonesData: goal.milestonesData,
      lastUpdated: goal.lastUpdated?.toISOString?.() || goal.lastUpdated || new Date().toISOString(),
      createdAt: goal.createdAt?.toISOString?.() || goal.createdAt || new Date().toISOString(),
    };
  }
}
