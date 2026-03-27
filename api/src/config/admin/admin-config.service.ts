// src/modules/config/admin/admin-config.service.ts
import { AdminConfigRepository } from './admin-config.repo.js';
import {
  CreateConfigDto,
  UpdateConfigDto,
  AdminConfigResponse,
  AdminConfigListResponse,
} from './admin-config.types.js';
import { AppError } from '../../../shared/errors/appError.js';
import { v4 as uuidv4 } from 'uuid';

export class AdminConfigService {
  private repo: AdminConfigRepository;

  constructor() {
    this.repo = new AdminConfigRepository();
  }

  async create(dto: CreateConfigDto): Promise<AdminConfigResponse> {
    // Check if config category already exists
    const existing = await this.repo.findByKey(dto.category);
    if (existing) {
      throw new AppError('Configuration with this category already exists', 400);
    }

    const config = await this.repo.create({
      id: uuidv4(),
      category: dto.category,
      displayName: dto.displayName,
      description: dto.description,
      values: dto.values,
      metadata: dto.metadata || {},
      isActive: dto.isActive ?? true,
      allowCustomValues: dto.allowCustomValues ?? false,
      sortOrder: dto.sortOrder ?? 0,
      stateCode: dto.stateCode,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    return this.toResponse(config);
  }

  async list(filters: {
    category?: string;
    isActive?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<AdminConfigListResponse> {
    const { rows, count } = await this.repo.findAllConfigs(
      {
        category: filters.category,
        isActive: filters.isActive,
        search: filters.search,
      },
      filters.page || 1,
      filters.limit || 50
    );

    return {
      configs: rows.map(c => this.toResponse(c)),
      total: count,
    };
  }

  async getById(id: string): Promise<AdminConfigResponse> {
    const config = await this.repo.findById(id);
    if (!config) {
      throw new AppError('Configuration not found', 404);
    }
    return this.toResponse(config);
  }

  async update(id: string, dto: UpdateConfigDto): Promise<AdminConfigResponse> {
    const config = await this.repo.findById(id);
    if (!config) {
      throw new AppError('Configuration not found', 404);
    }

    const updated = await this.repo.update(id, dto);
    return this.toResponse(updated);
  }

  async delete(id: string): Promise<void> {
    const config = await this.repo.findById(id);
    if (!config) {
      throw new AppError('Configuration not found', 404);
    }

    await this.repo.delete(id);
  }

  private toResponse(config: any): AdminConfigResponse {
    return {
      id: config.id,
      category: config.category,
      displayName: config.displayName,
      description: config.description,
      values: config.values,
      metadata: config.metadata,
      isActive: config.isActive,
      allowCustomValues: config.allowCustomValues,
      sortOrder: config.sortOrder,
      stateCode: config.stateCode,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
    };
  }
}
