// src/modules/goal/goal.types.ts

type GoalDomain = 'reading' | 'math' | 'writing' | 'behavior' | 'behavioral' | 'social' | 'communication' | 'motor' | 'adaptive' | 'academic' | 'self_care_independent_living' | 'vocational' | 'transition' | 'social_emotional' | 'speech_language' | 'occupational_therapy' | 'physical_therapy' | 'other';

export interface CreateGoalDto {
  childId: string;
  goalText: string;
  goalName?: string;
  domain?: GoalDomain;
  category?: GoalDomain; // backward-compat alias for domain
  targetDate?: Date;
  notes?: string;
  milestonesData?: Record<string, any>;
}

export interface UpdateGoalDto {
  goalText?: string;
  goalName?: string;
  domain?: GoalDomain;
  category?: GoalDomain; // backward-compat alias for domain
  targetDate?: Date;
  status?: 'not_started' | 'in_progress' | 'achieved' | 'modified' | 'discontinued';
  progressPercentage?: number;
  notes?: string;
  milestonesData?: Record<string, any>;
}

export interface UpdateProgressDto {
  progressPercentage: number;
  status: 'not_started' | 'in_progress' | 'achieved' | 'modified' | 'discontinued';
  notes?: string;
}

export interface GoalResponse {
  id: string;
  childId: string;
  goalText: string;
  goalName?: string;
  domain: string;
  category: string; // backward-compat alias for domain
  baseline?: string;
  target?: string;
  currentValue?: string;
  targetValue?: string;
  targetDate?: string;
  startDate?: string;
  status: string;
  progressPercentage: number;
  notes: string;
  milestonesData: Record<string, any>;
  lastUpdated: string;
  createdAt: string;
}

export interface GoalSummaryResponse {
  total: number;
  byStatus: Record<string, number>;
  byCategory: Record<string, number>;
  averageProgress: number;
}
