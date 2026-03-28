// src/modules/advocacy/advocacy.service.ts
import { AdvocacyInsight } from './advocacy.model.js';
import { AdvocacyRepository } from './advocacy.repo.js';
import { CreateAdvocacyInsightDto, UpdateAdvocacyInsightDto, GenerateInsightDto, SearchSimilarCasesDto } from './advocacy.types.js';
import { ChildProfile } from '../child/child.model.js';
import { AppError } from '../../shared/errors/appError.js';
import { getAiService, getVectorDbService, notification } from '../../shared/services.js';
import { GeminiService } from '../ai/gemini.service.js';
import { z } from 'zod';
import crypto from 'crypto';

const langchainAi = getAiService();
const vectorDb = getVectorDbService();

const GeneratedInsightSchema = z.object({
  priority: z.enum(['high', 'medium', 'low']),
  category: z.string(),
  title: z.string(),
  description: z.string(),
  actionItems: z.array(z.string()),
  confidenceScore: z.number().min(0).max(1),
});

// In-memory session storage
interface SessionMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AdvocacySessionData {
  id: string;
  userId: string;
  childId: string;
  scenarioType: 'iep_meeting' | 'school_team' | 'dispute_resolution';
  goal: string;
  messages: SessionMessage[];
  status: 'active' | 'completed' | 'abandoned';
  createdAt: Date;
  lastActivity: Date;
}

const sessionStore = new Map<string, AdvocacySessionData>();

// Cleanup inactive sessions every 5 minutes
setInterval(() => {
  const now = Date.now();
  const THIRTY_MINUTES = 30 * 60 * 1000;
  
  for (const [sessionId, session] of sessionStore.entries()) {
    if (now - session.lastActivity.getTime() > THIRTY_MINUTES) {
      sessionStore.delete(sessionId);
      console.log(`[Advocacy Lab] Cleaned up inactive session: ${sessionId}`);
    }
  }
}, 5 * 60 * 1000);

export class AdvocacyService {
  private repo: AdvocacyRepository;

  constructor() {
    this.repo = new AdvocacyRepository();
  }

  async create(userId: string, data: CreateAdvocacyInsightDto): Promise<AdvocacyInsight> {
    return this.repo.create({
      ...data,
      userId,
      triggerData: data.triggerData || {},
      aiGenerated: data.aiGenerated ?? false,
    } as any);
  }

  async generate(userId: string, data: GenerateInsightDto): Promise<AdvocacyInsight> {
    // Build context for AI — include child profile data
    let context = '';
    if (data.childId) {
      const child = await ChildProfile.findByPk(data.childId);
      if (child) {
        context += this.buildChildContextString(child);
      }
    }
    context += `\nUser Context: ${data.context}`;

    if (data.focusAreas && data.focusAreas.length > 0) {
      context += `\n\nFocus Areas: ${data.focusAreas.join(', ')}`;
    }

    // Search for similar cases if history is needed
    if (data.includeHistory) {
      const similarCases = await vectorDb.search(data.context, {
        limit: 3,
        entityType: 'advocacy_insight',
      });

      if (similarCases.length > 0) {
        context += '\n\nSimilar Past Cases:';
        similarCases.forEach((case_: any, i: number) => {
          context += `\n${i + 1}. ${case_.content}`;
        });
      }
    }

    // Generate insight using AI
    const prompt = this.buildInsightPrompt(context);
    const response = await langchainAi.chatAsObject({
      messages: [{ role: 'user', content: prompt }],
      schema: {},
      responseJsonSchema: GeneratedInsightSchema,
    });
    const generated = response.object;

    // Create the insight
    const insight = await this.repo.create({
      userId,
      childId: data.childId,
      priority: generated.priority,
      category: generated.category,
      title: generated.title,
      description: generated.description,
      actionItems: generated.actionItems,
      status: 'active',
      triggerData: {
        generated: true,
        context: data.context,
        focusAreas: data.focusAreas,
      },
      aiGenerated: true,
      aiConfidenceScore: generated.confidenceScore,
    } as any);

    // Send notification for high-priority insights
    if (generated.priority === 'high') {
      await notification.sendEmail(
        {
          to: `user-${userId}@notification.local`, // Replace with actual user email
          subject: `High Priority Advocacy Alert: ${generated.title}`,
          body: `${generated.description}\n\nRecommended Actions:\n${generated.actionItems.map((a: string, i: number) => `${i + 1}. ${a}`).join('\n')}`,
        },
        undefined,
        undefined
      );
    }

    // Store embedding for future searches
    await vectorDb.insert({
      entityType: 'advocacy_insight',
      entityId: insight.id,
      text: `${generated.title}\n\n${generated.description}\n\nActions: ${generated.actionItems.join(' ')}`,
      metadata: {
        priority: generated.priority,
        category: generated.category,
        childId: data.childId,
      },
    });

    return insight;
  }

  async searchSimilarCases(data: SearchSimilarCasesDto): Promise<Array<{
    id: string;
    content: string;
    similarity: number;
    metadata: Record<string, any>;
  }>> {
    const entityType = 'advocacy_insight';
    const options: any = { limit: data.limit || 5 };
    
    if (entityType) {
      options.entityType = entityType;
    }
    
    if (data.childId) {
      options.metadata = { childId: data.childId };
    }

    const results = await vectorDb.search(data.query, options);

    return results.map((result: any) => ({
      id: result.entityId as string,
      content: '', // vectorDb doesn't return content, only metadata
      similarity: result.similarity,
      metadata: result.metadata || {},
    }));
  }

  async findByUserId(
    userId: string,
    filters?: {
      childId?: string;
      priority?: string;
      status?: string;
      category?: string;
    }
  ): Promise<AdvocacyInsight[]> {
    return this.repo.findByUserId(userId, filters);
  }

  async findActive(userId: string): Promise<AdvocacyInsight[]> {
    return this.repo.findActive(userId);
  }

  async findById(id: string): Promise<AdvocacyInsight> {
    const insight = await this.repo.findById(id);
    if (!insight) {
      throw new AppError('Advocacy insight not found', 404, 'INSIGHT_NOT_FOUND');
    }
    return insight;
  }

  async update(id: string, data: UpdateAdvocacyInsightDto): Promise<AdvocacyInsight> {
    await this.findById(id);
    return this.repo.update(id, data);
  }

  async updateStatus(id: string, status: string): Promise<AdvocacyInsight> {
    await this.findById(id);
    return this.repo.updateStatus(id, status, new Date());
  }

  async softDelete(id: string): Promise<void> {
    await this.findById(id);
    await this.repo.softDelete(id);
  }

  async getStatsByChild(childId: string): Promise<{
    total: number;
    byPriority: Record<string, number>;
    byCategory: Record<string, number>;
    byStatus: Record<string, number>;
  }> {
    return this.repo.getStatsByChild(childId);
  }

  /**
   * Meeting Simulation Methods (Advocacy Lab)
   */
  
  async simulateMeeting(userMessage: string, childContext: string): Promise<string> {
    const gemini = GeminiService.create();
    if (!gemini) {
      throw new AppError('AI service not configured. Please set GEMINI_API_KEY.', 500, 'AI_NOT_CONFIGURED');
    }

    const systemPrompt = `You are a school administrator role-playing in an IEP meeting simulation.
Your job is to respond realistically to the parent's advocacy statements, then provide coaching feedback.

After your response as the school admin, add a "Coach Note:" section that:
- Evaluates the parent's approach (tone, specificity, knowledge of their rights)
- Suggests improvements or stronger phrasing
- References relevant educational frameworks (IDEA, FAPE, Section 504, LRE) for informational purposes
- Encourages continued practice
- Reminds parents this is a practice tool and not legal advice

Be constructive, supportive, and educational. Help parents build confidence and communication skills.`;

    const prompt = `Child Context: ${childContext}\n\nParent's Statement: "${userMessage}"\n\nRespond as the school administrator, then provide coaching feedback.`;

    const response = await gemini.chat(
      [{ role: 'user', content: prompt }],
      { systemPrompt, temperature: 0.7, maxTokens: 2048 }
    );

    return response;
  }

  async createAdvocacySession(
    userId: string,
    childId: string,
    scenarioType: 'iep_meeting' | 'school_team' | 'dispute_resolution',
    goal: string
  ): Promise<AdvocacySessionData> {
    const sessionId = crypto.randomUUID();
    const now = new Date();
    
    const initialMessage: SessionMessage = {
      role: 'assistant',
      content: `Hello! I'm your Advocacy Lab coach. Let's practice for ${scenarioType === 'iep_meeting' ? 'an IEP team meeting' : scenarioType === 'school_team' ? 'a school team meeting' : 'dispute resolution'}. I'll act as the school representative. Your goal: ${goal}. How would you like to start?`,
      timestamp: now
    };

    const session: AdvocacySessionData = {
      id: sessionId,
      userId,
      childId,
      scenarioType,
      goal,
      messages: [initialMessage],
      status: 'active',
      createdAt: now,
      lastActivity: now
    };

    sessionStore.set(sessionId, session);
    console.log(`[Advocacy Lab] Created session ${sessionId} for user ${userId}`);
    
    return session;
  }

  async sendSessionMessage(
    sessionId: string,
    userId: string,
    message: string,
    childContext: string
  ): Promise<SessionMessage> {
    const session = sessionStore.get(sessionId);

    if (!session) {
      throw new AppError('Session not found or expired', 404, 'SESSION_NOT_FOUND');
    }

    if (session.userId !== userId) {
      throw new AppError('Unauthorized access to session', 403, 'FORBIDDEN');
    }

    // Enrich context with child profile data if available
    let enrichedContext = childContext || '';
    if (session.childId && !enrichedContext) {
      const child = await ChildProfile.findByPk(session.childId);
      if (child) enrichedContext = this.buildChildContextString(child);
    }

    // Add user message
    const userMessage: SessionMessage = {
      role: 'user',
      content: message,
      timestamp: new Date()
    };
    session.messages.push(userMessage);

    // Get AI response
    const aiResponseText = await this.simulateMeeting(message, enrichedContext);
    
    const aiMessage: SessionMessage = {
      role: 'assistant',
      content: aiResponseText,
      timestamp: new Date()
    };
    session.messages.push(aiMessage);
    
    // Update last activity
    session.lastActivity = new Date();
    sessionStore.set(sessionId, session);
    
    return aiMessage;
  }

  async getAdvocacySession(sessionId: string, userId: string): Promise<AdvocacySessionData> {
    const session = sessionStore.get(sessionId);
    
    if (!session) {
      throw new AppError('Session not found or expired', 404, 'SESSION_NOT_FOUND');
    }
    
    if (session.userId !== userId) {
      throw new AppError('Unauthorized access to session', 403, 'FORBIDDEN');
    }
    
    // Update last activity
    session.lastActivity = new Date();
    sessionStore.set(sessionId, session);
    
    return session;
  }

  async deleteAdvocacySession(sessionId: string, userId: string): Promise<void> {
    const session = sessionStore.get(sessionId);
    
    if (!session) {
      throw new AppError('Session not found or expired', 404, 'SESSION_NOT_FOUND');
    }
    
    if (session.userId !== userId) {
      throw new AppError('Unauthorized access to session', 403, 'FORBIDDEN');
    }
    
    sessionStore.delete(sessionId);
    console.log(`[Advocacy Lab] Deleted session ${sessionId}`);
  }

  private buildChildContextString(child: ChildProfile): string {
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
    if (child.nextIepReviewDate) details.push(`Next IEP Review: ${new Date(child.nextIepReviewDate).toLocaleDateString()}`);
    return details.length > 0 ? `Child Profile:\n${details.join('\n')}\n` : '';
  }

  private buildInsightPrompt(context: string): string {
    return `You are an expert IEP advocate analyzing a child's situation to provide actionable insights.

Context:
${context}

Analyze this situation and generate an advocacy insight that helps the parent understand:
1. What the issue or opportunity is
2. Why it matters for their child's IEP
3. Specific actions they should take

Guidelines:
- Be specific and actionable
- Reference IEP laws/rights when relevant (IDEA, FAPE, LRE)
- Consider the parent's advocacy level (assume intermediate)
- Focus on empowerment, not fear
- Provide 3-5 concrete action items

Priority Levels:
- HIGH: Urgent legal/compliance issues, missed services, deadline concerns
- MEDIUM: Progress concerns, service gaps, documentation needs
- LOW: Proactive improvements, best practices, educational opportunities

Categories:
- "Limited Progress": Goal stagnation or regression
- "Service Gap": Missing or insufficient services
- "Compliance Risk": School not following IEP
- "Deadline Approaching": Important dates coming up
- "Documentation Need": Missing paperwork or records
- "Communication Issue": Need to address with school
- "Rights Awareness": Parent should know about specific rights

Return:
- priority: One of 'high', 'medium', 'low'
- category: One of the categories above
- title: Clear, action-oriented title (max 100 chars)
- description: Detailed explanation (200-500 words) with legal context
- actionItems: Array of 3-5 specific actions to take
- confidenceScore: Your confidence in this insight (0.0 to 1.0)`;
  }
}
