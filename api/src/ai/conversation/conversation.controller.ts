// src/modules/ai/conversation/conversation.controller.ts
import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/authenticate.js';
import { ConversationService } from './conversation.service.js';
import {
  createConversationSchema,
  sendMessageSchema,
  listConversationsSchema,
} from './conversation.validation.js';

export class ConversationController {
  private service: ConversationService;

  constructor() {
    this.service = new ConversationService();
  }

  create = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const dto = createConversationSchema.parse(req.body);
      const conversation = await this.service.create(req.user!.id, dto);
      res.status(201).json(conversation);
    } catch (error) {
      next(error);
    }
  };

  sendMessage = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { conversationId } = req.params;
      const dto = sendMessageSchema.parse(req.body);
      const response = await this.service.sendMessage(req.user!.id, conversationId, dto);
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  list = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const filters = listConversationsSchema.parse(req.query);
      const conversations = await this.service.list(req.user!.id, filters);
      res.json(conversations);
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { conversationId } = req.params;
      const conversation = await this.service.getById(req.user!.id, conversationId);
      res.json(conversation);
    } catch (error) {
      next(error);
    }
  };

  archive = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { conversationId } = req.params;
      await this.service.archive(req.user!.id, conversationId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };
}
