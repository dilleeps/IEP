// src/modules/smart-prompts/smart-prompts.controller.ts
import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/authenticate.js';
import { SmartPromptService } from './smart-prompts.service.js';
import { listPromptsSchema, acknowledgePromptSchema } from './smart-prompts.validation.js';

export class SmartPromptController {
  private service: SmartPromptService;

  constructor() {
    this.service = new SmartPromptService();
  }

  list = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const filters = listPromptsSchema.parse(req.query);
      const prompts = await this.service.list(req.user!.id, filters);
      res.json(prompts);
    } catch (error) {
      next(error);
    }
  };

  acknowledge = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const dto = acknowledgePromptSchema.parse(req.body);
      await this.service.acknowledge(req.user!.id, id, dto);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };
}
