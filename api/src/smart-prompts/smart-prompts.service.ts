// src/modules/smart-prompts/smart-prompts.service.ts
import { SmartPromptRepository } from './smart-prompts.repo.js';
import {
  SmartPromptResponse,
  SmartPromptListResponse,
  AcknowledgePromptDto,
} from './smart-prompts.types.js';
import { AppError } from '../../shared/errors/appError.js';

export class SmartPromptService {
  private repo: SmartPromptRepository;

  constructor() {
    this.repo = new SmartPromptRepository();
  }

  async list(
    userId: string,
    filters: {
      category?: string;
      priority?: string;
      acknowledged?: boolean;
      childId?: string;
      page?: number;
      limit?: number;
    }
  ): Promise<SmartPromptListResponse> {
    const { rows, count } = await this.repo.findByUserId(
      {
        userId,
        category: filters.category,
        priority: filters.priority,
        acknowledged: filters.acknowledged,
        childId: filters.childId,
      },
      filters.page || 1,
      filters.limit || 20
    );

    const unacknowledgedCount = await this.repo.countUnacknowledged(userId);

    return {
      prompts: rows.map(p => this.toResponse(p)),
      total: count,
      unacknowledgedCount,
    };
  }

  async acknowledge(userId: string, promptId: string, dto: AcknowledgePromptDto): Promise<void> {
    const prompt = await this.repo.findByIdAndUserId(promptId, userId);
    if (!prompt) {
      throw new AppError('Smart prompt not found', 404);
    }

    if (prompt.acknowledged) {
      throw new AppError('Prompt already acknowledged', 400);
    }

    const acknowledged = await this.repo.acknowledge(promptId, userId);
    if (!acknowledged) {
      throw new AppError('Failed to acknowledge prompt', 500);
    }

    // TODO: If feedback provided, store it for analytics
    if (dto.feedback) {
      // Could log to analytics service
    }
  }

  private toResponse(prompt: any): SmartPromptResponse {
    return {
      id: prompt.id,
      userId: prompt.userId,
      childId: prompt.childId,
      promptType: prompt.promptType,
      category: prompt.category,
      priority: prompt.priority,
      title: prompt.title,
      message: prompt.message,
      actionable: prompt.actionable,
      actionUrl: prompt.actionUrl,
      actionLabel: prompt.actionLabel,
      contextData: prompt.contextData,
      acknowledged: prompt.acknowledged,
      acknowledgedAt: prompt.acknowledgedAt,
      expiresAt: prompt.expiresAt,
      createdAt: prompt.createdAt,
    };
  }
}
