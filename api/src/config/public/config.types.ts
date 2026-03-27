// src/modules/config/public/config.types.ts

export interface ConfigResponse {
  id: string;
  category: string;
  displayName: string;
  values: Record<string, any>;
  description?: string;
  metadata: Record<string, any>;
  isActive: boolean;
}

export interface ConfigListResponse {
  configs: ConfigResponse[];
  total: number;
}

export interface ConfigByCategoryResponse {
  category: string;
  configs: ConfigResponse[];
}
