// src/modules/resource/resource.controller.ts
import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/authenticate.js';
import { ResourceService } from './resource.service.js';
import { ResourceResponse } from './resource.types.js';

export class ResourceController {
  private service: ResourceService;

  constructor() {
    this.service = new ResourceService();
  }

  create = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const resource = await this.service.create(req.body, req.user!.id);
      res.status(201).json(this.toResourceResponse(resource));
    } catch (error) {
      next(error);
    }
  };

  list = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { category, resourceType, tags, state, targetAudience, search } = req.query;
      
      const filters: any = {
        category: category as string,
        resourceType: resourceType as string,
        state: state as string,
        search: search as string,
      };

      // Parse comma-separated arrays
      if (tags) {
        filters.tags = (tags as string).split(',').map(t => t.trim());
      }
      if (targetAudience) {
        filters.targetAudience = (targetAudience as string).split(',').map(t => t.trim());
      }

      const resources = await this.service.findAll(filters);

      res.json({
        resources: resources.map(r => this.toResourceResponse(r)),
      });
    } catch (error) {
      next(error);
    }
  };

  getPopular = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const resources = await this.service.findPopular(limit);
      
      res.json({
        resources: resources.map(r => this.toResourceResponse(r)),
      });
    } catch (error) {
      next(error);
    }
  };

  getByCategory = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const resources = await this.service.findByCategory(req.params.category);
      
      res.json({
        resources: resources.map(r => this.toResourceResponse(r)),
      });
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const resource = await this.service.findById(req.params.id, true);
      res.json(this.toResourceResponse(resource));
    } catch (error) {
      next(error);
    }
  };

  update = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const updated = await this.service.update(req.params.id, req.body);
      res.json(this.toResourceResponse(updated));
    } catch (error) {
      next(error);
    }
  };

  rate = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      await this.service.rate(req.params.id, req.body.rating);
      res.json({ message: 'Resource rated successfully' });
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      await this.service.delete(req.params.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };

  private toResourceResponse(resource: any): ResourceResponse {
    return {
      id: resource.id,
      title: resource.title,
      description: resource.description,
      category: resource.category,
      resourceType: resource.resourceType,
      url: resource.url,
      content: resource.content,
      tags: resource.tags,
      targetAudience: resource.targetAudience,
      state: resource.state,
      isActive: resource.isActive,
      viewCount: resource.viewCount,
      rating: resource.rating,
      createdAt: resource.createdAt.toISOString(),
    };
  }
}
