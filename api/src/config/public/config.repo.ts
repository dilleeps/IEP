// src/modules/config/public/config.repo.ts
import { SystemConfiguration } from '../config.model.js';
import { BaseRepo } from '../../shared/db/base.repo.js';

interface ListConfigFilters {
  category?: string;
  isActive?: boolean;
}

export class ConfigRepository extends BaseRepo<SystemConfiguration> {
  constructor() {
    super(SystemConfiguration);
  }

  async findAllConfigs(filters: ListConfigFilters = {}): Promise<SystemConfiguration[]> {
    const where: any = {};

    if (filters.category) {
      where.category = filters.category;
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    return await this.model.findAll({
      where,
      order: [['category', 'ASC']],
    });
  }

  async findByCategory(category: string): Promise<SystemConfiguration[]> {
    return await this.model.findAll({
      where: {
        category: category,
        isActive: true,
      },
      order: [['category', 'ASC']],
    });
  }

  async findByKey(key: string): Promise<SystemConfiguration | null> {
    return await this.model.findOne({
      where: {
        category: key,
        isActive: true,
      },
    });
  }
}
