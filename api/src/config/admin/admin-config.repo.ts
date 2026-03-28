// src/modules/config/admin/admin-config.repo.ts
import { SystemConfiguration } from '../config.model.js';
import { BaseRepo } from '../../shared/db/base.repo.js';
import { Op } from 'sequelize';

interface ListAdminConfigFilters {
  category?: string;
  isActive?: boolean;
  search?: string;
}

export class AdminConfigRepository extends BaseRepo<SystemConfiguration> {
  constructor() {
    super(SystemConfiguration);
  }

  async findAllConfigs(
    filters: ListAdminConfigFilters = {},
    page: number = 1,
    limit: number = 50
  ): Promise<{ rows: SystemConfiguration[]; count: number }> {
    const where: any = {};

    if (filters.category) {
      where.category = filters.category;
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters.search) {
      where[Op.or] = [
        { category: { [Op.iLike]: `%${filters.search}%` } },
        { displayName: { [Op.iLike]: `%${filters.search}%` } },
        { description: { [Op.iLike]: `%${filters.search}%` } },
      ];
    }

    return await this.model.findAndCountAll({
      where,
      order: [['category', 'ASC']],
      limit,
      offset: (page - 1) * limit,
    });
  }

  async findByKey(key: string): Promise<SystemConfiguration | null> {
    return await this.model.findOne({
      where: { category: key },
    });
  }
}
