import { v4 as uuidv4 } from 'uuid';
import { AppError } from '../../../shared/errors/appError.js';
import { GeminiService } from '../../ai/gemini.service.js';
import {
  CreateSessionResponse,
  LegalSupportMessage,
  LegalSupportSession,
  SendMessageDto,
  SendMessageResponse,
} from './legalSupport.types.js';

const LEGAL_SUPPORT_PROMPT = `You are an educational rights information assistant focused on IDEA and special education processes. Provide clear, plain-language answers with a brief "What to say" suggestion. Always include a short reminder that this is general educational information only and not legal advice — users should consult a licensed attorney for specific legal matters. Keep responses concise and actionable.`;

export const LEGAL_SUPPORT_MAX_HISTORY = 12;

const sessionStore = new Map<string, LegalSupportSession>();

export class LegalSupportService {
  constructor(
    private gemini: GeminiService | null = GeminiService.create(),
    private store: Map<string, LegalSupportSession> = sessionStore,
  ) {}

  createSession(userId: string): CreateSessionResponse {
    const id = uuidv4();
    const now = new Date();
    const session: LegalSupportSession = {
      id,
      userId,
      messages: [],
      createdAt: now,
      updatedAt: now,
    };

    this.store.set(id, session);

    return {
      sessionId: id,
      messages: session.messages,
    };
  }

  async sendMessage(userId: string, sessionId: string, dto: SendMessageDto): Promise<SendMessageResponse> {
    const session = this.requireSession(sessionId, userId);
    const message = dto.message.trim();

    if (!message) {
      throw new AppError('Message cannot be empty', 400, 'VALIDATION_ERROR');
    }

    const userMessage: LegalSupportMessage = {
      id: uuidv4(),
      role: 'user',
      content: message,
      createdAt: new Date(),
    };

    session.messages.push(userMessage);
    this.trimHistory(session);

    const reply = await this.generateReply(session);

    const assistantMessage: LegalSupportMessage = {
      id: uuidv4(),
      role: 'assistant',
      content: reply,
      createdAt: new Date(),
    };

    session.messages.push(assistantMessage);
    session.updatedAt = new Date();
    this.trimHistory(session);

    return {
      sessionId,
      reply,
      messages: session.messages,
    };
  }

  getSession(userId: string, sessionId: string): LegalSupportSession {
    return this.requireSession(sessionId, userId);
  }

  private async generateReply(session: LegalSupportSession): Promise<string> {
    if (!this.gemini) {
      throw new AppError('AI service not configured. Please set GEMINI_API_KEY.', 500);
    }

    const recentMessages = session.messages.slice(-LEGAL_SUPPORT_MAX_HISTORY);
    const response = await this.gemini.chat(
      recentMessages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      {
        systemPrompt: LEGAL_SUPPORT_PROMPT,
        temperature: 0.4,
        maxTokens: 600,
      },
    );

    return response || 'I can share general IDEA information and next steps. Please try again with another question.';
  }

  private requireSession(sessionId: string, userId: string): LegalSupportSession {
    const session = this.store.get(sessionId);

    if (!session || session.userId !== userId) {
      throw new AppError('Session not found', 404, 'NOT_FOUND');
    }

    return session;
  }

  private trimHistory(session: LegalSupportSession) {
    if (session.messages.length > LEGAL_SUPPORT_MAX_HISTORY) {
      session.messages = session.messages.slice(-LEGAL_SUPPORT_MAX_HISTORY);
    }
  }
}
