// src/modules/advocacy/advocacy.types.ts

export interface CreateAdvocacyInsightDto {
  childId?: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
  title: string;
  description: string;
  actionItems: string[];
  triggerType?: string;
  triggerData?: Record<string, any>;
  aiGenerated?: boolean;
  aiConfidenceScore?: number;
}

export interface UpdateAdvocacyInsightDto {
  priority?: 'high' | 'medium' | 'low';
  category?: string;
  title?: string;
  description?: string;
  actionItems?: string[];
  status?: 'active' | 'acknowledged' | 'acted_upon' | 'dismissed';
}

export interface GenerateInsightDto {
  childId: string;
  context: string;
  focusAreas?: string[];
  includeHistory?: boolean;
}

export interface SearchSimilarCasesDto {
  query: string;
  childId?: string;
  limit?: number;
}

export interface AdvocacyInsightResponse {
  id: string;
  childId?: string;
  priority: string;
  category: string;
  title: string;
  description: string;
  actionItems: string[];
  status: string;
  acknowledgedAt?: string;
  dismissedAt?: string;
  triggerType?: string;
  triggerData: Record<string, any>;
  aiGenerated: boolean;
  aiConfidenceScore?: number;
  createdAt: string;
}

export interface SimilarCaseResponse {
  id: string;
  content: string;
  similarity: number;
  metadata: Record<string, any>;
}

export interface AdvocacyStatsResponse {
  total: number;
  byPriority: Record<string, number>;
  byCategory: Record<string, number>;
  byStatus: Record<string, number>;
}
