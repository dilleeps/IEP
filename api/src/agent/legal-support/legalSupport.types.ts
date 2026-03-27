export type LegalSupportRole = 'user' | 'assistant';

export interface LegalSupportMessage {
  id: string;
  role: LegalSupportRole;
  content: string;
  createdAt: Date;
}

export interface LegalSupportSession {
  id: string;
  userId: string;
  messages: LegalSupportMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSessionResponse {
  sessionId: string;
  messages: LegalSupportMessage[];
}

export interface SendMessageDto {
  message: string;
}

export interface SendMessageResponse {
  sessionId: string;
  reply: string;
  messages: LegalSupportMessage[];
}
