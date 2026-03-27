// src/modules/ai/conversation/conversation.service.ts
import { ConversationRepository } from './conversation.repo.js';
import {
  CreateConversationDto,
  SendMessageDto,
  ConversationResponse,
  ConversationListResponse,
  AiMessageResponse,
  ConversationMessage,
} from './conversation.types.js';
import { AppError } from '../../../shared/errors/appError.js';
import { GeminiService } from '../gemini.service.js';
import { v4 as uuidv4 } from 'uuid';

export class ConversationService {
  private repo: ConversationRepository;
  private gemini: GeminiService | null;

  constructor() {
    this.repo = new ConversationRepository();
    this.gemini = GeminiService.create();
  }

  async create(userId: string, dto: CreateConversationDto): Promise<ConversationResponse> {
    const conversation = await this.repo.create({
      id: uuidv4(),
      userId,
      childId: dto.childId,
      conversationType: dto.conversationType === 'meeting_simulation' ? 'meeting_prep' : dto.conversationType,
      title: dto.title,
      status: 'active',
      messageCount: 0,
      conversationData: { messages: [] },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // If initial message provided, process it
    if (dto.initialMessage) {
      await this.sendMessage(userId, conversation.id, {
        message: dto.initialMessage,
      });
    }

    return this.toResponse(conversation);
  }

  async sendMessage(userId: string, conversationId: string, dto: SendMessageDto): Promise<AiMessageResponse> {
    const conversation = await this.repo.findByIdAndUserId(conversationId, userId);
    if (!conversation) {
      throw new AppError('Conversation not found', 404);
    }

    // Get existing messages
    const conversationData = conversation.conversationData || { messages: [] };
    const messages: ConversationMessage[] = conversationData.messages || [];

    // Add user message
    const userMessage: ConversationMessage = {
      id: uuidv4(),
      role: 'user',
      content: dto.message,
      timestamp: new Date(),
      metadata: dto.context,
    };
    messages.push(userMessage);

    // Generate AI response based on conversation type
    if (!this.gemini) {
      throw new AppError('AI service not configured. Please set GEMINI_API_KEY.', 500);
    }

    const systemPrompt = this.getSystemPrompt(conversation.conversationType as any);
    const aiResponseText = await this.gemini.chat(
      messages.slice(-10).map(m => ({ role: m.role as any, content: m.content })),
      { systemPrompt, temperature: 0.7 }
    );

    // Add AI message
    const assistantMessage: ConversationMessage = {
      id: uuidv4(),
      role: 'assistant',
      content: aiResponseText,
      timestamp: new Date(),
    };
    messages.push(assistantMessage);

    // Update conversation
    await this.repo.updateConversationData(conversationId, { messages });
    await this.repo.incrementMessageCount(conversationId);

    return {
      conversationId,
      message: assistantMessage,
    };
  }

  async list(
    userId: string,
    filters: {
      conversationType?: string;
      childId?: string;
      page?: number;
      limit?: number;
    }
  ): Promise<ConversationListResponse> {
    const { rows, count } = await this.repo.findByUserId(
      {
        userId,
        conversationType: filters.conversationType,
        childId: filters.childId,
        status: 'active',
      },
      filters.page || 1,
      filters.limit || 20
    );

    return {
      conversations: rows.map(c => this.toResponse(c)),
      total: count,
    };
  }

  async getById(userId: string, conversationId: string): Promise<ConversationResponse> {
    const conversation = await this.repo.findByIdAndUserId(conversationId, userId);
    if (!conversation) {
      throw new AppError('Conversation not found', 404);
    }

    const response = this.toResponse(conversation);
    response.messages = (conversation.conversationData?.messages || []) as ConversationMessage[];
    return response;
  }

  async archive(userId: string, conversationId: string): Promise<void> {
    const conversation = await this.repo.findByIdAndUserId(conversationId, userId);
    if (!conversation) {
      throw new AppError('Conversation not found', 404);
    }

    await this.repo.update(conversationId, { status: 'archived' });
  }

  private toResponse(conversation: any): ConversationResponse {
    return {
      id: conversation.id,
      userId: conversation.userId,
      childId: conversation.childId,
      conversationType: conversation.conversationType,
      title: conversation.title,
      status: conversation.status,
      messageCount: conversation.messageCount,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
    };
  }

  private getSystemPrompt(type: string): string {
    const prompts: Record<string, string> = {
      meeting_prep: `You are an expert IEP meeting preparation assistant. Help parents prepare for IEP meetings by:
- Providing guidance on what to expect
- Helping formulate questions and concerns
- Suggesting data to bring
- Role-playing difficult conversations
- Explaining IEP terms and processes
Be supportive, informative, and empowering.`,
      
      legal_qa: `You are a special education legal expert assistant. Provide guidance on:
- IDEA rights and regulations
- State special education laws
- Procedural safeguards
- Due process procedures
- Advocacy strategies
IMPORTANT: Always clarify you provide general information, not legal advice. Recommend consulting an attorney for specific legal matters.`,
      
      iep_help: `You are an IEP development assistant. Help with:
- Understanding IEP components
- Developing appropriate goals
- Understanding accommodations and modifications
- Understanding evaluations and assessments
- Progress monitoring strategies
Be practical and focused on child outcomes.`,
      
      advocacy_advice: `You are a special education advocacy coach. Provide:
- Communication strategies with school staff
- Documentation best practices
- Understanding of parental rights
- Collaborative problem-solving approaches
- When to escalate concerns
Be empowering and strategic.`,
      
      general: `You are a supportive special education assistant. Help with any questions about:
- IEP processes
- Special education services
- Parent rights
- Child development and support
Be warm, informative, and encouraging.`,
    };

    return prompts[type] || prompts.general;
  }
}
