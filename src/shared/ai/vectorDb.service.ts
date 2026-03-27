// src/shared/vector/vectorDb.service.ts
// PGVector-backed vector DB service (insert + search) with simple metadata equals filters.

import { QueryTypes } from "sequelize";
import { LangChainAiService } from "./langchainAi.service.js";
import type { IAiService } from "./ai.service.js";
import { getSequelize } from "../../config/sequelize.js";

export type MetadataValue = string | number;
export type MetadataEquals = Record<string, MetadataValue>;

export interface VectorInsertRequest {
  entityType: string;
  entityId: string | number;
  text: string;
  metadata?: MetadataEquals; // equals-only
}

export interface VectorInsertResponse {
  id: string | number;
}

export interface VectorSearchOptions {
  limit?: number;      // default 5
  distance?: number;   // similarity threshold (0..1 typically when using 1 - cosineDistance)
  metadata?: MetadataEquals; // equals-only
  entityType?: string; // optional shortcut filter (common)
}

export interface VectorSearchResult {
  id: string | number;
  entityType: string;
  entityId: string | number;
  metadata: Record<string, any> | null;
  similarity: number;
}

export interface IVectorDbService {
  insert(req: VectorInsertRequest): Promise<VectorInsertResponse>;
  search(queryText: string, options?: VectorSearchOptions): Promise<VectorSearchResult[]>;
}

export class PgVectorDbService implements IVectorDbService {
  constructor(private readonly ai: IAiService) {}

  static fromLangChain(opts: {
    apiKey: string;
    aiDefaults?: { model?: string; temperature?: number; systemMessage?: string };
  }) {
    const ai = new LangChainAiService({ apiKey: opts.apiKey, defaults: opts.aiDefaults });
    return new PgVectorDbService(ai);
  }

  async insert(req: VectorInsertRequest): Promise<VectorInsertResponse> {
    const emb = await this.ai.embed(req.text, { taskType: "RETRIEVAL_DOCUMENT" });

    const sequelize = getSequelize();

    const sql = `
      INSERT INTO vector_embeddings (entity_type, entity_id, metadata, embedding)
      VALUES (:entityType, :entityId, :metadata::jsonb, :embedding::vector)
      RETURNING id
    `;

    const rows = (await sequelize.query(sql, {
      replacements: {
        entityType: req.entityType,
        entityId: String(req.entityId),
        metadata: JSON.stringify(req.metadata ?? {}),
        embedding: toVectorLiteral(emb.vector), // "[0.1,0.2,...]"
      },
      type: QueryTypes.SELECT, // yes, RETURNING still comes back as rows
    })) as Array<{ id: any }>;

    return { id: rows?.[0]?.id };
  }

  async search(queryText: string, options?: VectorSearchOptions): Promise<VectorSearchResult[]> {
    const sequelize = getSequelize();

    const limit = options?.limit ?? 5;

    const queryEmbedding = await this.ai.embed(queryText, { taskType: "RETRIEVAL_QUERY" });

    // Build WHERE: entityType (simple) + metadata equals (jsonb)
    const whereParts: string[] = [];
    const replacements: Record<string, any> = {
      queryEmbedding: toVectorLiteral(queryEmbedding.vector),
      limit,
    };

    if (options?.entityType) {
      whereParts.push(`entity_type = :entityType`);
      replacements.entityType = options.entityType;
    }

    const meta = options?.metadata;
    if (meta && Object.keys(meta).length > 0) {
      const { clauses, repl } = buildMetadataClauses(meta);
      whereParts.push(...clauses);
      Object.assign(replacements, repl);
    }

    const whereClause = whereParts.length ? `WHERE ${whereParts.join(" AND ")}` : "";

    const query = `
      SELECT 
        id,
        entity_type as "entityType",
        entity_id as "entityId",
        metadata,
        1 - (embedding <=> :queryEmbedding::vector) as similarity
      FROM vector_embeddings
      ${whereClause}
      ORDER BY embedding <=> :queryEmbedding::vector
      LIMIT :limit
    `;

    const results = (await sequelize.query(query, {
      replacements,
      type: QueryTypes.SELECT,
    })) as VectorSearchResult[];

    // optional similarity threshold
    if (typeof options?.distance === "number") {
      return results.filter(r => Number(r.similarity) >= options.distance!);
    }

    return results;
  }
}

/** pgvector literal: "[0.1,0.2,0.3]" */
function toVectorLiteral(vector: number[]): string {
  const nums = vector.map(v => (Number.isFinite(v) ? v : 0));
  return `[${nums.join(",")}]`;
}

/**
 * Metadata equals-only:
 * - strings:  metadata->>'k' = 'v'
 * - numbers: (metadata->>'k')::numeric = 123
 */
function buildMetadataClauses(metadata: MetadataEquals): {
  clauses: string[];
  repl: Record<string, any>;
} {
  const clauses: string[] = [];
  const repl: Record<string, any> = {};

  let i = 0;
  for (const [key, value] of Object.entries(metadata)) {
    const kName = `mk_${i}`;
    const vName = `mv_${i}`;

    repl[kName] = key;

    if (typeof value === "number") {
      clauses.push(`(metadata->>:${kName})::numeric = :${vName}`);
      repl[vName] = value;
    } else {
      clauses.push(`metadata->>:${kName} = :${vName}`);
      repl[vName] = String(value);
    }
    i++;
  }

  return { clauses, repl };
}
