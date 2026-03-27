// src/modules/communication/communication.types.ts

export interface CreateCommunicationLogDto {
  childId: string;
  date: Date;
  contactType: 'email' | 'phone' | 'meeting' | 'letter' | 'portal' | 'other';
  contactWith: string;
  contactRole?: string;
  subject: string;
  summary: string;
  followUpRequired?: boolean;
  followUpDate?: Date;
  attachments?: any;
}

export interface UpdateCommunicationLogDto {
  date?: Date;
  contactType?: 'email' | 'phone' | 'meeting' | 'letter' | 'portal' | 'other';
  contactWith?: string;
  contactRole?: string;
  subject?: string;
  summary?: string;
  followUpRequired?: boolean;
  followUpDate?: Date;
  attachments?: any;
}

export interface CommunicationLogResponse {
  id: string;
  childId: string;
  date: string;
  contactType: string;
  contactWith: string;
  contactRole?: string;
  subject: string;
  summary: string;
  followUpRequired: boolean;
  followUpDate?: string;
  attachments: any;
  createdAt: string;
}

export interface CommunicationStatsResponse {
  total: number;
  byType: Record<string, number>;
  recentCount: number;
  followUpsPending: number;
}
