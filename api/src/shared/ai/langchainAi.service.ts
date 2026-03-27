// src/shared/ai/langchainAi.service.ts
//
// LangChain-backed IAiService implementation using:
// - Short-term memory via LangGraph checkpointer + thread_id (docs pattern) :contentReference[oaicite:4]{index=4}
// - Structured output via createAgent(responseFormat) and reading structuredResponse :contentReference[oaicite:5]{index=5}

import {
  IAiService,
  ChatRequest,
  ChatResponse,
  ChatAsObjectRequest,
  ChatAsObjectResponse,
  EmbedOptions,
  EmbedResponse,
  ChatMessage,
} from "./ai.service.js";

import { ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { HumanMessage, AIMessage, SystemMessage } from "@langchain/core/messages";

import {
  createAgent,
  providerStrategy,
} from "langchain";

import { MemorySaver } from "@langchain/langgraph";

export class LangChainAiService implements IAiService {
  private readonly chatModel: ChatGoogleGenerativeAI;
  private readonly embeddings: GoogleGenerativeAIEmbeddings;

  // Checkpointer = thread-level persistence (short-term memory) :contentReference[oaicite:6]{index=6}
  private readonly checkpointer = new MemorySaver();

  private readonly defaults = {
    model: "gemini-2.0-flash",
    temperature: 0.3,
    systemMessage: "You are a helpful assistant. Be concise and accurate.",
  };

  constructor(opts?: { apiKey?: string; defaults?: { model?: string; temperature?: number; systemMessage?: string } }) {
    if (opts?.defaults?.model) this.defaults.model = opts.defaults.model;
    if (typeof opts?.defaults?.temperature === "number") this.defaults.temperature = opts.defaults.temperature;
    if (opts?.defaults?.systemMessage) this.defaults.systemMessage = opts.defaults.systemMessage;

    this.chatModel = new ChatGoogleGenerativeAI({
      apiKey: opts?.apiKey || process.env.GEMINI_API_KEY,
      model: this.defaults.model,
      temperature: this.defaults.temperature,
    });

    this.embeddings = new GoogleGenerativeAIEmbeddings({
      apiKey: opts?.apiKey || process.env.GEMINI_API_KEY,
      model: "text-embedding-004",
    });
  }

  async chat(req: ChatRequest): Promise<ChatResponse> {
    const conversationId = req.conversationId ?? this.newConversationId();

    // Build messages: systemInstruction first (once per call is fine; memory persists thread anyway)
    const systemText = req.metadata?.systemMessage ?? this.defaults.systemMessage;
    const lcMessages = this.toLangChainMessages(req.messages, systemText);

    // Create agent with short-term memory (checkpointer) :contentReference[oaicite:7]{index=7}
    const agent = createAgent({
      model: this.chatModel,
      tools: [],
      checkpointer: this.checkpointer,
    });

    const result: any = await agent.invoke(
      { messages: lcMessages },
      { configurable: { thread_id: conversationId } } // thread_id == conversation id :contentReference[oaicite:8]{index=8}
    );

    // createAgent returns final state; messages are usually in result.messages
    const text = this.extractAssistantText(result);

    return { conversationId, text, raw: result };
  }

  async chatAsObject<T extends Record<string, any> = Record<string, any>>(
    req: ChatAsObjectRequest
  ): Promise<ChatAsObjectResponse<T>> {
    const conversationId = req.conversationId ?? this.newConversationId();

    const systemText = req.metadata?.systemMessage ?? this.defaults.systemMessage;
    const lcMessages = this.toLangChainMessages(req.messages, systemText);

    // Structured output is configured on the agent via responseFormat :contentReference[oaicite:9]{index=9}
    // Your contract gives Record<string, any> schema, so we treat it like JSON schema.
    // providerStrategy prefers provider-native when supported (Gemini supports it in many cases). :contentReference[oaicite:10]{index=10}
    const schema = (req.responseJsonSchema ?? req.schema) as any;
    const responseFormat = schema ? providerStrategy(schema) : undefined;

    const agent = createAgent({
      model: this.chatModel,
      tools: [],
      checkpointer: this.checkpointer,
      responseFormat,
    });

    const result: any = await agent.invoke(
      { messages: lcMessages },
      { configurable: { thread_id: conversationId } }
    );

    const structured = result?.structuredResponse as T | undefined;
    const text = this.extractAssistantText(result);

    // If structuredResponse exists, that’s the source of truth.
    // Otherwise fallback to parsing the text (rare, but safe).
    const object = structured ?? this.tryParseJson<T>(text);

    return { conversationId, object, text, raw: result };
  }

  async embed(text: string, _options?: EmbedOptions): Promise<EmbedResponse> {
    const vector = await this.embeddings.embedQuery(text);
    return { vector, model: "text-embedding-004" };
  }

  // ---------------- helpers ----------------

  private toLangChainMessages(messages: ChatMessage[], systemMessage?: string) {
    const out: any[] = [];
    if (systemMessage?.trim()) out.push(new SystemMessage(systemMessage));

    for (const m of messages) {
      switch (m.role) {
        case "system":
          // If callers send system messages too, include them after the primary system message
          out.push(new SystemMessage(m.content));
          break;
        case "assistant":
          out.push(new AIMessage(m.content));
          break;
        default:
          out.push(new HumanMessage(m.content));
          break;
      }
    }
    return out;
  }

  private extractAssistantText(result: any): string {
    // LangChain agent state generally includes `messages`.
    // Get the last AI message content.
    const msgs = result?.messages ?? [];
    for (let i = msgs.length - 1; i >= 0; i--) {
      const m = msgs[i];
      const type = typeof m?.getType === "function" ? m.getType() : m?._getType?.();
      if (type === "ai" || type === "assistant") {
        const c = m?.content;
        return Array.isArray(c) ? c.map(String).join("") : String(c ?? "");
      }
    }

    // fallback: some models may set output in other keys
    if (typeof result?.output === "string") return result.output;
    return "";
  }

  private newConversationId(): string {
    return `c_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
  }

  private tryParseJson<T extends Record<string, any>>(text: string): T {
    try {
      return JSON.parse(text) as T;
    } catch {
      const s = text.indexOf("{");
      const e = text.lastIndexOf("}");
      if (s >= 0 && e > s) {
        try {
          return JSON.parse(text.slice(s, e + 1)) as T;
        } catch {}
      }
    }
    return { _parseError: true, _rawText: text } as unknown as T;
  }
}
