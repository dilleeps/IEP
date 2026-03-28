import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/authenticate.js';
import { ChildService } from './child.service.js';
import { ChildRepository } from './child.repo.js';
import { ChildResponse } from './child.types.js';

export class ChildController {
  private service: ChildService;

  constructor() {
    this.service = new ChildService(new ChildRepository());
  }

  create = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const child = await this.service.create(req.user!.id, req.body);
      res.status(201).json(this.toResponse(child));
    } catch (error) {
      next(error);
    }
  };

  list = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const includeInactive = req.query.active === 'false';
      const children = await this.service.findByUserId(req.user!.id, includeInactive);
      res.json({
        children: children.map(c => this.toResponse(c)),
      });
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const child = await this.service.findById(req.params.id);
      res.json(this.toResponse(child));
    } catch (error) {
      next(error);
    }
  };

  update = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const child = await this.service.update(req.params.id, req.body);
      res.json(this.toResponse(child));
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      await this.service.softDelete(req.params.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };

  private toResponse(child: any): ChildResponse {
    return {
      id: child.id,
      name: child.name,
      age: child.age,
      grade: child.grade,
      schoolName: child.schoolName,
      schoolDistrict: child.schoolDistrict,
      country: child.country,
      homeAddress: child.homeAddress,
      phoneNumber: child.phoneNumber,
      disabilities: child.disabilities,
      focusTags: child.focusTags || [],
      lastIepDate: child.lastIepDate ? new Date(child.lastIepDate).toISOString() : undefined,
      nextIepReviewDate: child.nextIepReviewDate ? new Date(child.nextIepReviewDate).toISOString() : undefined,
      advocacyLevel: child.advocacyLevel,
      primaryGoal: child.primaryGoal,
      stateContext: child.stateContext,
      accommodationsSummary: child.accommodationsSummary,
      servicesSummary: child.servicesSummary,
      isActive: child.isActive,
      createdAt: child.createdAt ? new Date(child.createdAt).toISOString() : undefined,
    };
  }
}
