// src/modules/config/public/config.controller.ts
import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../../middleware/authenticate.js';
import { ConfigService } from './config.service.js';
import { listConfigsSchema } from './config.validation.js';

export class ConfigController {
  private service: ConfigService;

  constructor() {
    this.service = new ConfigService();
  }

  list = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const filters = listConfigsSchema.parse(req.query);
      const configs = await this.service.list(filters);
      res.json(configs);
    } catch (error) {
      next(error);
    }
  };

  getByCategory = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { category } = req.params;
      const configs = await this.service.getByCategory(category);
      res.json(configs);
    } catch (error) {
      next(error);
    }
  };
}
