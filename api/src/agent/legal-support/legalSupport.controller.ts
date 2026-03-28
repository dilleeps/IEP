import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/authenticate.js';
import { LegalSupportService } from './legalSupport.service.js';
import { getSessionSchema, sendMessageSchema } from './legalSupport.validation.js';

export class LegalSupportController {
  constructor(private service = new LegalSupportService()) {}

  createSession = (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const session = this.service.createSession(req.user!.id);
      res.status(201).json(this.formatSessionResponse(session));
    } catch (error) {
      next(error);
    }
  };

  sendMessage = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { sessionId } = sendMessageSchema.params.parse(req.params);
      const { message } = sendMessageSchema.body.parse(req.body);
      const response = await this.service.sendMessage(req.user!.id, sessionId, { message });
      res.json({
        sessionId: response.sessionId,
        reply: response.reply,
        messages: this.formatMessages(response.messages),
      });
    } catch (error) {
      next(error);
    }
  };

  getSession = (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { sessionId } = getSessionSchema.params.parse(req.params);
      const session = this.service.getSession(req.user!.id, sessionId);
      res.json(this.formatSessionResponse(session));
    } catch (error) {
      next(error);
    }
  };

  private formatSessionResponse(session: any) {
    const sessionId = session.sessionId ?? session.id;
    return {
      sessionId,
      messages: this.formatMessages(session.messages),
      createdAt: session.createdAt instanceof Date ? session.createdAt.toISOString() : session.createdAt,
      updatedAt: session.updatedAt instanceof Date ? session.updatedAt.toISOString() : session.updatedAt,
    };
  }

  private formatMessages(messages: any[]) {
    return messages.map((message) => ({
      ...message,
      createdAt: message.createdAt instanceof Date ? message.createdAt.toISOString() : message.createdAt,
    }));
  }
}
