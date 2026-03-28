// src/modules/behavior/behavior.types.ts

export interface CreateBehaviorLogDto {
  childId: string;
  date: Date;
  behaviorType: 'positive' | 'negative' | 'neutral';
  description: string;
  context?: string;
  triggers?: string;
  interventions?: string;
  outcome?: string;
  severity?: number;
  duration?: number;
  location?: string;
  witnesses?: string[];
  tags?: string[];
}

export interface UpdateBehaviorLogDto {
  date?: Date;
  behaviorType?: 'positive' | 'negative' | 'neutral';
  description?: string;
  context?: string;
  triggers?: string;
  interventions?: string;
  outcome?: string;
  severity?: number;
  duration?: number;
  location?: string;
  witnesses?: string[];
  tags?: string[];
}

export interface BehaviorLogResponse {
  id: string;
  childId: string;
  date: string;
  behaviorType: string;
  description: string;
  context?: string;
  triggers?: string;
  interventions?: string;
  outcome?: string;
  severity?: number;
  duration?: number;
  location?: string;
  witnesses?: string[];
  tags: string[];
  createdAt: string;
}

export interface BehaviorPatternResponse {
  total: number;
  byType: Record<string, number>;
  averageSeverity: number;
  commonTriggers: string[];
  effectiveInterventions: string[];
  timePatterns: Record<string, number>;
}
