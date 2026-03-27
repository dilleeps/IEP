// src/shared/ai/ai.service.ts
// Pure AI service (Gemini only). Uses @google/genai "config" (not generationConfig).

import { GoogleGenAI } from "@google/genai";

export type Role = "system" | "user" | "assistant";

export interface ChatMessage {
  role: Role;
  content: string;
}

export interface ChatMetadata {
  systemMessage?: string;
  temperature?: number;
  model?: string;

  // optional knobs (nice to have)
  topP?: number;
  topK?: number;
  maxOutputTokens?: number;
  stopSequences?: string[];
}

export interface ChatRequest {
  conversationId?: string;
  messages: ChatMessage[];
  metadata?: ChatMetadata;
}

export interface ChatResponse {
  conversationId: string;
  text: string;
  raw?: any;
}

export interface ChatAsObjectRequest {
  conversationId?: string;
  messages: ChatMessage[];
  metadata?: ChatMetadata;

  /**
   * Your app-level schema hint.
   * If you can provide proper JSON Schema, pass it as metadata.responseJsonSchema instead (below).
   */
  schema: Record<string, any>;

  /**
   * If you have real JSON Schema, prefer this.
   * (Maps to config.responseJsonSchema)
   */
  responseJsonSchema?: unknown;
}

export interface ChatAsObjectResponse<T extends Record<string, any> = Record<string, any>> {
  conversationId: string;
  object: T;
  text: string;
  raw?: any;
}

export interface EmbedOptions {
  model?: string;
  taskType?: "RETRIEVAL_QUERY" | "RETRIEVAL_DOCUMENT" | "SEMANTIC_SIMILARITY" | "CLASSIFICATION";
  title?: string;
}

export interface EmbedResponse {
  vector: number[];
  model: string;
  raw?: any;
}

export interface IAiService {
  chat(req: ChatRequest): Promise<ChatResponse>;
  chatAsObject<T extends Record<string, any> = Record<string, any>>(
    req: ChatAsObjectRequest
  ): Promise<ChatAsObjectResponse<T>>;
  embed(text: string, options?: EmbedOptions): Promise<EmbedResponse>;
}

