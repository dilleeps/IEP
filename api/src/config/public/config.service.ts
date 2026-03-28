// src/modules/config/public/config.service.ts
import { ConfigRepository } from './config.repo.js';
import {
  ConfigResponse,
  ConfigListResponse,
  ConfigByCategoryResponse,
} from './config.types.js';
import { AppError } from '../../shared/errors/appError.js';

export class ConfigService {
  private repo: ConfigRepository;

  constructor() {
    this.repo = new ConfigRepository();
  }

  async list(filters: { category?: string; isActive?: boolean } = {}): Promise<ConfigListResponse> {
    const configs = await this.repo.findAllConfigs(filters);
    return {
      configs: configs.map(c => this.toResponse(c)),
      total: configs.length,
    };
  }

  async getByCategory(category: string): Promise<ConfigByCategoryResponse> {
    const configs = await this.repo.findByCategory(category);
    return {
      category,
      configs: configs.map(c => this.toResponse(c)),
    };
  }

  private toResponse(config: any): ConfigResponse {
    return {
      id: config.id,
      category: config.category,
      displayName: config.displayName,
      values: config.values,
      description: config.description,
      metadata: config.metadata,
      isActive: config.isActive,
    };
  }
}
