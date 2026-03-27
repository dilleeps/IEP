// src/modules/config/admin/admin-config.controller.ts
import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../../middleware/authenticate.js';
import { AdminConfigService } from './admin-config.service.js';
import {
  createConfigSchema,
  updateConfigSchema,
  listAdminConfigsSchema,
} from './admin-config.validation.js';

export class AdminConfigController {
  private service: AdminConfigService;

  constructor() {
    this.service = new AdminConfigService();
  }

  create = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const dto = createConfigSchema.parse(req.body);
      const config = await this.service.create(dto);
      res.status(201).json(config);
    } catch (error) {
      next(error);
    }
  };

  list = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const filters = listAdminConfigsSchema.parse(req.query);
      const configs = await this.service.list(filters);
      res.json(configs);
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const config = await this.service.getById(id);
      res.json(config);
    } catch (error) {
      next(error);
    }
  };

  update = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const dto = updateConfigSchema.parse(req.body);
      const config = await this.service.update(id, dto);
      res.json(config);
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      await this.service.delete(id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };
}
