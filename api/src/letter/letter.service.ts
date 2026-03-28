// src/modules/letter/letter.service.ts
import { LetterDraft } from './letter.model.js';
import { LetterTemplate } from './template.model.js';
import { LetterRepository, LetterTemplateRepository } from './letter.repo.js';
import { CreateLetterDto, UpdateLetterDto, GenerateLetterDto, SendLetterDto } from './letter.types.js';
import { ChildProfile } from '../child/child.model.js';
import { AppError } from '../shared/errors/appError.js';
import { getAiService, notification } from '../shared/services.js';
import { z } from 'zod';

const langchainAi = getAiService();

const GeneratedLetterSchema = z.object({
  subject: z.string(),
  content: z.string(),
  tone: z.string(),
  keywords: z.array(z.string()),
});

export class LetterService {
  private repo: LetterRepository;
  private templateRepo: LetterTemplateRepository;

  constructor() {
    this.repo = new LetterRepository();
    this.templateRepo = new LetterTemplateRepository();
  }

  async create(userId: string, data: CreateLetterDto): Promise<LetterDraft> {
    return this.repo.create({
      ...data,
      userId,
      title: data.title || 'Untitled Letter',
      status: 'draft',
    } as any);
  }

  async generate(userId: string, data: GenerateLetterDto): Promise<LetterDraft> {
    // Get template if specified
    let templateContent = '';
    if (data.templateId) {
      const template = await this.templateRepo.findById(data.templateId);
      if (template) {
        templateContent = template.content;
        await this.templateRepo.incrementUsage(data.templateId);
      }
    }

    // Load child profile for context
    let childProfile: ChildProfile | null = null;
    if (data.childId) {
      childProfile = await ChildProfile.findByPk(data.childId);
    }

    // Build AI prompt
    const prompt = this.buildGenerationPrompt(data, templateContent, childProfile);

    // Generate letter using AI
    const response = await langchainAi.chatAsObject({
      messages: [{ role: 'user', content: prompt }],
      schema: {},
      responseJsonSchema: GeneratedLetterSchema,
    });
    const generated = response.object;

    // Create draft letter
    return this.repo.create({
      userId,
      childId: data.childId,
      letterType: data.letterType,
      title: generated.subject || 'Generated Letter',
      content: generated.content,
      status: 'draft',
      generationContext: {
        generated: true,
        purpose: data.purpose,
        keyPoints: data.keyPoints,
        templateId: data.templateId,
        tone: generated.tone,
        keywords: generated.keywords,
      },
    } as any);
  }

  async send(letterId: string, userId: string, data: SendLetterDto): Promise<void> {
    const letter = await this.findById(letterId);
    
    if (letter.userId !== userId) {
      throw new AppError('Forbidden', 403, 'FORBIDDEN');
    }

    if (letter.status === 'sent') {
      throw new AppError('Letter already sent', 400, 'ALREADY_SENT');
    }

    // Send email
    await notification.sendEmail(
      {
        to: data.recipientEmail,
        subject: letter.title,
        body: this.formatLetterForEmail(letter.content),
      },
      undefined,
      undefined
    );

    // Update status
    await this.repo.updateStatus(letterId, 'sent');
  }

  async findByUserId(
    userId: string,
    filters?: {
      childId?: string;
      letterType?: string;
      status?: string;
    }
  ): Promise<LetterDraft[]> {
    return this.repo.findByUserId(userId, filters);
  }

  async findById(id: string): Promise<LetterDraft> {
    const letter = await this.repo.findById(id);
    if (!letter) {
      throw new AppError('Letter not found', 404, 'LETTER_NOT_FOUND');
    }
    return letter;
  }

  async update(id: string, data: UpdateLetterDto): Promise<LetterDraft> {
    await this.findById(id);
    return this.repo.update(id, data);
  }

  async updateStatus(id: string, status: 'draft' | 'final' | 'sent'): Promise<LetterDraft> {
    await this.findById(id);
    return this.repo.updateStatus(id, status);
  }

  async softDelete(id: string): Promise<void> {
    await this.findById(id);
    await this.repo.softDelete(id);
  }

  // Template methods
  async getTemplates(category?: string): Promise<LetterTemplate[]> {
    if (category) {
      return this.templateRepo.findByCategory(category);
    }
    return this.templateRepo.findActive();
  }

  async getTemplateById(id: string): Promise<LetterTemplate> {
    const template = await this.templateRepo.findById(id);
    if (!template) {
      throw new AppError('Template not found', 404, 'TEMPLATE_NOT_FOUND');
    }
    return template;
  }

  private buildGenerationPrompt(data: GenerateLetterDto, templateContent: string, child?: ChildProfile | null): string {
    const toneGuide = {
      formal: 'Use professional, respectful language with proper formal structure.',
      friendly: 'Use warm, approachable language while remaining professional.',
      assertive: 'Use confident, clear language that firmly states your position.',
      empathetic: 'Use understanding, compassionate language that acknowledges concerns.',
    };

    const tone = data.tone || 'formal';

    // Build child context from profile
    let childContext = '';
    if (child) {
      const details: string[] = [];
      if (child.name) details.push(`Child's Name: ${child.name}`);
      if (child.grade) details.push(`Grade: ${child.grade}`);
      if (child.schoolName) details.push(`School: ${child.schoolName}`);
      if (child.schoolDistrict) details.push(`School District: ${child.schoolDistrict}`);
      if (child.primaryDisability) details.push(`Primary Disability: ${child.primaryDisability}`);
      if (child.secondaryDisability) details.push(`Secondary Disability: ${child.secondaryDisability}`);
      if (child.accommodationsSummary) details.push(`Current Accommodations: ${child.accommodationsSummary}`);
      if (child.servicesSummary) details.push(`Current Services: ${child.servicesSummary}`);
      if (child.lastIepDate) details.push(`Last IEP Date: ${new Date(child.lastIepDate).toLocaleDateString()}`);
      if (child.nextIepReviewDate) details.push(`Next IEP Review Date: ${new Date(child.nextIepReviewDate).toLocaleDateString()}`);
      if (details.length > 0) {
        childContext = `\nChild Profile Information:\n${details.join('\n')}\n`;
      }
    }

    return `You are an expert IEP advocate helping a parent write a ${data.letterType} letter to their child's school.
${childContext}
Purpose: ${data.purpose}

Key Points to Address:
${data.keyPoints.map((point, i) => `${i + 1}. ${point}`).join('\n')}

${data.additionalContext ? `Additional Context: ${data.additionalContext}\n` : ''}
${templateContent ? `Template Reference:\n${templateContent}\n` : ''}

Tone Guidelines: ${toneGuide[tone]}

Generate a professional letter that:
1. Has a clear, concise subject line
2. Opens with appropriate greeting and context
3. Uses the child's actual name, school, and district in the letter
4. Addresses each key point with supporting reasoning
5. References the child's specific disabilities and services when relevant
6. Uses IEP-relevant terminology correctly (FAPE, LRE, IEP, 504, etc.)
7. Cites relevant laws (IDEA, Section 504) when appropriate
8. Maintains a ${tone} tone throughout
9. Ends with clear next steps and contact information
10. Is formatted properly for email or print

Return:
- subject: Clear subject line (max 100 chars)
- content: Full letter body with proper formatting (paragraphs, greeting, closing)
- tone: Confirmed tone used
- keywords: 5-10 relevant keywords for this letter (IEP terms, issues, etc.)`;
  }

  private formatLetterForEmail(content: string): string {
    // Convert plain text to basic HTML formatting
    return content
      .split('\n\n')
      .map(para => `<p>${para.replace(/\n/g, '<br>')}</p>`)
      .join('');
  }
}
