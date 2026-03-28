// src/modules/smart-prompts/smart-prompts.types.ts

export interface SmartPromptResponse {
  id: string;
  userId: string;
  childId?: string;
  promptType: string;
  category: string;
  priority: string;
  title: string;
  message: string;
  actionable: boolean;
  actionUrl?: string;
  actionLabel?: string;
  contextData: Record<string, any>;
  acknowledged: boolean;
  acknowledgedAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
}

export interface SmartPromptListResponse {
  prompts: SmartPromptResponse[];
  total: number;
  unacknowledgedCount: number;
}

export interface AcknowledgePromptDto {
  feedback?: string;
}
