// src/modules/letter/letter.repo.ts
import { LetterDraft } from './letter.model.js';
import { LetterTemplate } from './template.model.js';
import { BaseRepo } from '../../shared/db/base.repo.js';

export interface LetterFilters {
  childId?: string;
  letterType?: string;
  status?: string;
}

export class LetterRepository extends BaseRepo<LetterDraft> {
  constructor() {
    super(LetterDraft);
  }

  async findByUserId(userId: string, filters?: LetterFilters): Promise<LetterDraft[]> {
    const where: any = { userId };
    
    if (filters?.childId) where.childId = filters.childId;
    if (filters?.letterType) where.letterType = filters.letterType;
    if (filters?.status) where.status = filters.status;

    return this.model.findAll({ where, order: [['createdAt', 'DESC']] });
  }

  async updateStatus(id: string, status: 'draft' | 'final' | 'sent'): Promise<LetterDraft> {
    const letter = await this.findById(id);
    if (!letter) throw new Error('Letter not found');
    
    letter.status = status as any;
    await letter.save();
    return letter;
  }
}

export class LetterTemplateRepository extends BaseRepo<LetterTemplate> {
  constructor() {
    super(LetterTemplate);
  }

  async findActive(): Promise<LetterTemplate[]> {
    return this.model.findAll({
      where: { isActive: true },
      order: [['usageCount', 'DESC'], ['name', 'ASC']],
    });
  }

  async findByCategory(category: string): Promise<LetterTemplate[]> {
    return this.model.findAll({
      where: { category, isActive: true },
      order: [['usageCount', 'DESC']],
    });
  }

  async incrementUsage(id: string): Promise<void> {
    const template = await this.findById(id);
    if (template) {
      template.usageCount++;
      await template.save();
    }
  }
}
