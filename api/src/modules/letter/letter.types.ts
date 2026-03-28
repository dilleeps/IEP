// src/modules/letter/letter.types.ts

export interface CreateLetterDto {
  childId: string;
  letterType: 'request' | 'concern' | 'thank_you' | 'follow_up' | 'complaint' | 'appeal' | 'other';
  title: string;
  content: string;
  contentHtml?: string;
  generationContext?: Record<string, any>;
  parentDraftId?: string;
}

export interface UpdateLetterDto {
  childId?: string;
  letterType?: 'request' | 'concern' | 'thank_you' | 'follow_up' | 'complaint' | 'appeal' | 'other';
  title?: string;
  content?: string;
  contentHtml?: string;
  status?: 'draft' | 'final' | 'sent';
  generationContext?: Record<string, any>;
}

export interface GenerateLetterDto {
  letterType: 'request' | 'concern' | 'thank_you' | 'follow_up' | 'complaint' | 'appeal' | 'other';
  purpose: string;
  keyPoints: string[];
  childId?: string;
  recipient?: string;
  tone?: 'formal' | 'friendly' | 'assertive' | 'empathetic';
  templateId?: string;
  additionalContext?: string;
}

export interface LetterResponse {
  id: string;
  childId: string;
  letterType: string;
  title: string;
  content: string;
  contentHtml?: string;
  status: string;
  aiModel: string;
  generationContext?: Record<string, any>;
  revisionCount: number;
  sentDate?: string;
  sentTo?: string[];
  sentMethod?: string;
  parentDraftId?: string;
  versionNumber: number;
  lastEdited: string;
  createdAt: string;
}

export interface TemplateResponse {
  id: string;
  name: string;
  description: string;
  category: string;
  content: string;
  variables: string[];
  isActive: boolean;
  usageCount: number;
}

export interface SendLetterDto {
  recipientEmail: string;
  cc?: string[];
  attachments?: string[];
}
