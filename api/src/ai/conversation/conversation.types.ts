// src/modules/ai/conversation/conversation.types.ts

export interface CreateConversationDto {
  childId?: string;
  conversationType: 'meeting_simulation' | 'legal_qa' | 'iep_help' | 'advocacy_advice' | 'general';
  title: string;
  initialMessage?: string;
}

export interface SendMessageDto {
  message: string;
  context?: Record<string, any>;
}

export interface ConversationResponse {
  id: string;
  userId: string;
  childId?: string;
  conversationType: string;
  title: string;
  status: string;
  messageCount: number;
  messages?: ConversationMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface ConversationListResponse {
  conversations: ConversationResponse[];
  total: number;
}

export interface AiMessageResponse {
  conversationId: string;
  message: ConversationMessage;
}
