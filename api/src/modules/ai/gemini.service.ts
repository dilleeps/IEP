import { VectorEmbedding } from './vectorEmbedding.model.js';
import { getSequelize } from '../../config/sequelize.js';
import { appenv } from '../../config/appenv.js';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatOptions {
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  fileData?: {
    mimeType: string;
    data: string; // Base64 encoded file data
  };
}

interface SearchResult {
  id: string;
  entityType: string;
  entityId: string;
  similarity: number;
  metadata: Record<string, any>;
}

export class GeminiService {
  private apiKey: string;
  private model: string;
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta';

  private constructor(apiKey: string, model: string) {
    this.apiKey = apiKey;
    this.model = model;
  }

  /**
   * Create GeminiService instance
   * Returns null if GEMINI_API_KEY is not configured
   */
  static create(): GeminiService | null {
    const apiKey = appenv.get('GEMINI_API_KEY') || '';
    
    if (!apiKey) {
      console.warn('GEMINI_API_KEY not set. AI features will not work.');
      return null;
    }

    const model = appenv.get('GEMINI_MODEL') || 'gemini-2.0-flash-exp';
    return new GeminiService(apiKey, model);
  }

  /**
   * Chat with Gemini AI - returns text response
   */
  async chat(
    messages: ChatMessage[],
    options: ChatOptions = {}
  ): Promise<string> {
    const { temperature = 0.7, maxTokens = 2048, systemPrompt } = options;

    // Format messages for Gemini API
    const contents = messages.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    // Add system prompt if provided
    if (systemPrompt) {
      contents.unshift({
        role: 'user',
        parts: [{ text: systemPrompt }]
      });
    }

    const response = await fetch(
      `${this.baseUrl}/models/${this.model}:generateContent?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature,
            maxOutputTokens: maxTokens,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini API error: ${error}`);
    }

    const data = await response.json();
    return data.candidates[0]?.content?.parts[0]?.text || '';
  }

  /**
   * Chat with Gemini AI - returns structured JSON object using native JSON mode
   */
  async chatAsObject<T = any>(
    prompt: string,
    schema: Record<string, any>,
    options: ChatOptions = {}
  ): Promise<T> {
    const { temperature = 0.0, maxTokens = 2048, systemPrompt, fileData } = options;

    // Format messages for Gemini API
    const contents = [];
    
    if (systemPrompt) {
      contents.push({
        role: 'user',
        parts: [{ text: systemPrompt }]
      });
    }

    // Build user message parts (text + optional file)
    const userParts: any[] = [{ text: prompt }];
    
    // Add inline file data if provided (PDF, DOCX, images, etc.)
    if (fileData) {
      userParts.push({
        inlineData: {
          mimeType: fileData.mimeType,
          data: fileData.data, // Base64 encoded
        },
      });
    }

    contents.push({
      role: 'user',
      parts: userParts,
    });

    const response = await fetch(
      `${this.baseUrl}/models/${this.model}:generateContent?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature,
            maxOutputTokens: maxTokens,
            responseMimeType: 'application/json',
            responseSchema: schema,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini API error: ${error}`);
    }

    const data = await response.json();
    const candidate = data.candidates?.[0];
    const jsonText = candidate?.content?.parts?.[0]?.text || '{}';

    // Detect output truncation — try to salvage partial JSON instead of throwing
    const finishReason = candidate?.finishReason;
    let parsedJson: T;

    if (finishReason === 'MAX_TOKENS') {
      console.warn(`Gemini output truncated (MAX_TOKENS) — ${jsonText.length} chars. Attempting to salvage partial JSON.`);

      // Try multiple repair strategies
      const strategies = [
        // Strategy 1: Just close open brackets
        () => {
          let r = jsonText;
          const ob = (r.match(/\{/g) || []).length - (r.match(/\}/g) || []).length;
          const oq = (r.match(/\[/g) || []).length - (r.match(/\]/g) || []).length;
          for (let i = 0; i < oq; i++) r += ']';
          for (let i = 0; i < ob; i++) r += '}';
          return r;
        },
        // Strategy 2: Remove last incomplete item then close
        () => {
          let r = jsonText;
          // Find last complete object (ends with })
          const lastComplete = r.lastIndexOf('}');
          if (lastComplete > 0) {
            r = r.substring(0, lastComplete + 1);
          }
          const ob = (r.match(/\{/g) || []).length - (r.match(/\}/g) || []).length;
          const oq = (r.match(/\[/g) || []).length - (r.match(/\]/g) || []).length;
          for (let i = 0; i < oq; i++) r += ']';
          for (let i = 0; i < ob; i++) r += '}';
          return r;
        },
        // Strategy 3: Aggressively trim to last complete array item
        () => {
          let r = jsonText;
          // Find the last "},\n" or "}\n" pattern (end of a complete goal object)
          const matches = [...r.matchAll(/\}\s*,?\s*\n/g)];
          if (matches.length > 0) {
            const lastMatch = matches[matches.length - 1];
            r = r.substring(0, lastMatch.index! + 1);
          }
          const ob = (r.match(/\{/g) || []).length - (r.match(/\}/g) || []).length;
          const oq = (r.match(/\[/g) || []).length - (r.match(/\]/g) || []).length;
          for (let i = 0; i < oq; i++) r += ']';
          for (let i = 0; i < ob; i++) r += '}';
          return r;
        },
      ];

      let repaired = false;
      for (const strategy of strategies) {
        try {
          const attempt = strategy();
          parsedJson = JSON.parse(attempt) as T;
          console.info(`Salvaged truncated JSON — parsed successfully`);
          repaired = true;
          break;
        } catch (_e) {
          // Try next strategy
        }
      }

      if (!repaired) {
        // Last resort: return empty goals object
        console.warn(`All repair strategies failed for ${jsonText.length} chars — returning empty result`);
        parsedJson = { goals: [], services: [], accommodations: [], modifications: [] } as any;
      }
    } else {
      try {
        parsedJson = JSON.parse(jsonText) as T;
      } catch (error) {
        throw new Error(`Failed to parse JSON response (finishReason=${finishReason}, len=${jsonText.length}): ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return parsedJson;
  }

  /**
   * Create vector embedding for text using Gemini
   */
  async embed(text: string): Promise<number[]> {
    const embeddingModel = 'text-embedding-004';
    
    const response = await fetch(
      `${this.baseUrl}/models/${embeddingModel}:embedContent?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: `models/${embeddingModel}`,
          content: {
            parts: [{ text }]
          }
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini Embedding API error: ${error}`);
    }

    const data = await response.json();
    return data.embedding?.values || [];
  }

  /**
   * Store embedding in database
   */
  async storeEmbedding(
    entityType: string,
    entityId: string,
    text: string,
    metadata: Record<string, any> = {}
  ): Promise<void> {
    const embedding = await this.embed(text);
    
    await VectorEmbedding.create({
      entityType,
      entityId,
      embeddingModel: 'text-embedding-004',
      embedding,
      metadata,
    } as any);
  }

  /**
   * Search for similar items using vector similarity
   */
  async searchWithSimilarity(
    queryText: string,
    entityType?: string,
    limit: number = 10,
    minSimilarity: number = 0.7
  ): Promise<SearchResult[]> {
    // Get embedding for query
    const queryEmbedding = await this.embed(queryText);

    // Build SQL query for cosine similarity search using pgvector
    const sequelize = getSequelize();
    const whereClause = entityType ? `WHERE entity_type = :entityType` : '';
    
    const query = `
      SELECT 
        id,
        entity_type as "entityType",
        entity_id as "entityId",
        metadata,
        1 - (embedding <=> :queryEmbedding::vector) as similarity
      FROM vector_embeddings
      ${whereClause}
      ORDER BY embedding <=> :queryEmbedding::vector
      LIMIT :limit
    `;

    const results = await sequelize.query(query, {
      replacements: {
        queryEmbedding: `[${queryEmbedding.join(',')}]`,
        entityType,
        limit,
      },
      type: 'SELECT',
    }) as any[];

    // Filter by minimum similarity
    return results
      .filter(r => r.similarity >= minSimilarity)
      .map(r => ({
        id: r.id,
        entityType: r.entityType,
        entityId: r.entityId,
        similarity: r.similarity,
        metadata: r.metadata,
      }));
  }

  /**
   * Helper: Analyze IEP document
   */
  async analyzeIepDocument(extractedText: string): Promise<{
    summary: string;
    strengths: string[];
    concerns: string[];
    recommendations: string[];
    complianceIssues: string[];
    complianceScore: number;
  }> {
    const schema = {
      summary: 'string - brief overview of the IEP',
      strengths: 'array of strings - positive aspects',
      concerns: 'array of strings - areas of concern',
      recommendations: 'array of strings - actionable recommendations',
      complianceIssues: 'array of strings - compliance problems found',
      complianceScore: 'number 0-100 - compliance score',
    };

    const systemPrompt = `You are an expert IEP (Individualized Education Program) analyst. Analyze the following IEP document and provide detailed insights on strengths, concerns, recommendations, and compliance issues.`;

    return this.chatAsObject(extractedText, schema, { systemPrompt, temperature: 0.3 });
  }

  /**
   * Helper: Generate advocacy letter
   */
  async generateLetter(
    letterType: string,
    context: Record<string, any>,
    tone: string = 'professional'
  ): Promise<string> {
    const systemPrompt = `You are an expert in special education advocacy. Generate a ${tone} ${letterType} letter based on the provided context. The letter should be clear, respectful, and effective.`;

    const prompt = `Generate a ${letterType} letter with the following context:\n${JSON.stringify(context, null, 2)}`;

    return this.chat([{ role: 'user', content: prompt }], { systemPrompt, temperature: 0.7 });
  }

  /**
   * Helper: Generate advocacy insights
   */
  async generateInsights(
    childData: Record<string, any>,
    recentActivity: Record<string, any>[]
  ): Promise<{
    insights: Array<{
      type: string;
      title: string;
      description: string;
      priority: string;
      actionable: boolean;
    }>;
  }> {
    const schema = {
      insights: [
        {
          type: 'string - strength|concern|recommendation|strategy|resource',
          title: 'string - concise title',
          description: 'string - detailed description',
          priority: 'string - low|medium|high',
          actionable: 'boolean - whether this requires action',
        },
      ],
    };

    const systemPrompt = `You are an IEP advocacy expert. Analyze the child's profile and recent activity to generate actionable insights for parents.`;

    const prompt = `Child Profile:\n${JSON.stringify(childData, null, 2)}\n\nRecent Activity:\n${JSON.stringify(recentActivity, null, 2)}`;

    return this.chatAsObject(prompt, schema, { systemPrompt, temperature: 0.5 });
  }

  /**
   * Helper: Generate smart prompts
   */
  async generateSmartPrompts(
    childData: Record<string, any>,
    context: string
  ): Promise<{
    prompts: Array<{
      type: string;
      title: string;
      content: string;
      priority: string;
    }>;
  }> {
    const schema = {
      prompts: [
        {
          type: 'string - question|tip|reminder|action|warning|resource',
          title: 'string - prompt title',
          content: 'string - prompt content',
          priority: 'string - low|medium|high|urgent',
        },
      ],
    };

    const systemPrompt = `You are an IEP advocacy assistant. Generate helpful prompts, reminders, and tips for parents based on their child's situation and context.`;

    const prompt = `Child Profile:\n${JSON.stringify(childData, null, 2)}\n\nContext: ${context}`;

    return this.chatAsObject(prompt, schema, { systemPrompt, temperature: 0.6 });
  }
}
