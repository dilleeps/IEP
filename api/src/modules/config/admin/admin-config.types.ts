// src/modules/config/admin/admin-config.types.ts

export interface CreateConfigDto {
  category: string;
  displayName: string;
  description?: string;
  values: Record<string, any>;
  metadata?: Record<string, any>;
  isActive?: boolean;
  allowCustomValues?: boolean;
  sortOrder?: number;
  stateCode?: string;
}

export interface UpdateConfigDto {
  displayName?: string;
  description?: string;
  values?: Record<string, any>;
  metadata?: Record<string, any>;
  isActive?: boolean;
  allowCustomValues?: boolean;
  sortOrder?: number;
  stateCode?: string;
}

export interface AdminConfigResponse {
  id: string;
  category: string;
  displayName: string;
  description?: string;
  values: Record<string, any>;
  metadata: Record<string, any>;
  isActive: boolean;
  allowCustomValues: boolean;
  sortOrder: number;
  stateCode?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdminConfigListResponse {
  configs: AdminConfigResponse[];
  total: number;
}
