// src/modules/ai/conversation/conversation.repo.ts
import { AiConversation } from '../conversation.model.js';
import { BaseRepo } from '../../../shared/db/base.repo.js';
import { Op } from 'sequelize';

interface ListConversationsFilters {
  userId: string;
  conversationType?: string;
  childId?: string;
  status?: string;
}

export class ConversationRepository extends BaseRepo<AiConversation> {
  constructor() {
    super(AiConversation);
  }

  async findByUserId(
    filters: ListConversationsFilters,
    page: number = 1,
    limit: number = 20
  ): Promise<{ rows: AiConversation[]; count: number }> {
    const where: any = {
      userId: filters.userId,
      deletedAt: null,
    };

    if (filters.conversationType) {
      where.conversationType = filters.conversationType;
    }

    if (filters.childId) {
      where.childId = filters.childId;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    return await this.model.findAndCountAll({
      where,
      order: [['updatedAt', 'DESC']],
      limit,
      offset: (page - 1) * limit,
    });
  }

  async findByIdAndUserId(id: string, userId: string): Promise<AiConversation | null> {
    return await this.model.findOne({
      where: {
        id,
        userId,
      } as any,
    });
  }

  async incrementMessageCount(id: string): Promise<void> {
    await this.model.increment('messageCount', { where: { id } });
  }

  async updateConversationData(id: string, data: Record<string, any>): Promise<void> {
    await this.model.update(
      { conversationData: data },
      { where: { id } }
    );
  }
}
