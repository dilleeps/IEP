// src/modules/letter/letter.controller.ts
import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/authenticate.js';
import { LetterService } from './letter.service.js';
import { LetterResponse, TemplateResponse } from './letter.types.js';

export class LetterController {
  private service: LetterService;

  constructor() {
    this.service = new LetterService();
  }

  create = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const letter = await this.service.create(req.user!.id, req.body);
      res.status(201).json(this.toLetterResponse(letter));
    } catch (error) {
      next(error);
    }
  };

  generate = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const letter = await this.service.generate(req.user!.id, req.body);
      res.status(201).json(this.toLetterResponse(letter));
    } catch (error) {
      next(error);
    }
  };

  list = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { childId, letterType, status } = req.query;
      
      const letters = await this.service.findByUserId(req.user!.id, {
        childId: childId as string,
        letterType: letterType as string,
        status: status as string,
      });

      res.json({
        letters: letters.map(l => this.toLetterResponse(l)),
      });
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const letter = await this.service.findById(req.params.id);
      
      if (req.user?.role !== 'ADMIN' && letter.userId !== req.user!.id) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      res.json(this.toLetterResponse(letter));
    } catch (error) {
      next(error);
    }
  };

  update = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const letter = await this.service.findById(req.params.id);
      
      if (req.user?.role !== 'ADMIN' && letter.userId !== req.user!.id) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const updated = await this.service.update(req.params.id, req.body);
      res.json(this.toLetterResponse(updated));
    } catch (error) {
      next(error);
    }
  };

  updateStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const letter = await this.service.findById(req.params.id);
      
      if (req.user?.role !== 'ADMIN' && letter.userId !== req.user!.id) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const updated = await this.service.updateStatus(req.params.id, req.body.status);
      res.json(this.toLetterResponse(updated));
    } catch (error) {
      next(error);
    }
  };

  send = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      await this.service.send(req.params.id, req.user!.id, req.body);
      res.json({ message: 'Letter sent successfully' });
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const letter = await this.service.findById(req.params.id);
      
      if (req.user?.role !== 'ADMIN' && letter.userId !== req.user!.id) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      await this.service.softDelete(req.params.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };

  // Template endpoints
  getTemplates = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { category } = req.query;
      const templates = await this.service.getTemplates(category as string);
      
      res.json({
        templates: templates.map(t => this.toTemplateResponse(t)),
      });
    } catch (error) {
      next(error);
    }
  };

  getTemplateById = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const template = await this.service.getTemplateById(req.params.id);
      res.json(this.toTemplateResponse(template));
    } catch (error) {
      next(error);
    }
  };

  private toLetterResponse(letter: any): LetterResponse {
    return {
      id: letter.id,
      childId: letter.childId,
      letterType: letter.letterType,
      title: letter.title,
      content: letter.content,
      contentHtml: letter.contentHtml,
      status: letter.status,
      aiModel: letter.aiModel,
      generationContext: letter.generationContext,
      revisionCount: letter.revisionCount,
      sentDate: letter.sentDate?.toISOString(),
      sentTo: letter.sentTo,
      sentMethod: letter.sentMethod,
      parentDraftId: letter.parentDraftId,
      versionNumber: letter.versionNumber,
      lastEdited: letter.lastEdited.toISOString(),
      createdAt: letter.createdAt.toISOString(),
    };
  }

  private toTemplateResponse(template: any): TemplateResponse {
    return {
      id: template.id,
      name: template.name,
      description: template.description,
      category: template.category,
      content: template.content,
      variables: template.variables,
      isActive: template.isActive,
      usageCount: template.usageCount,
    };
  }
}
