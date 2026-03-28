// src/modules/resource/resource.repo.ts
import { Resource } from './resource.model.js';
import { BaseRepo } from '../shared/db/base.repo.js';
import { Op } from 'sequelize';

export interface ResourceFilters {
  category?: string;
  resourceType?: string;
  tags?: string[];
  state?: string;
  targetAudience?: string[];
  search?: string;
}

export class ResourceRepository extends BaseRepo<Resource> {
  constructor() {
    super(Resource);
  }

  async findAllFiltered(filters?: ResourceFilters): Promise<Resource[]> {
    const where: any = { isActive: true };
    
    if (filters?.category) where.category = filters.category;
    if (filters?.resourceType) where.resourceType = filters.resourceType;
    if (filters?.state) where.state = filters.state;
    
    if (filters?.tags && filters.tags.length > 0) {
      where.tags = { [Op.overlap]: filters.tags };
    }
    
    if (filters?.targetAudience && filters.targetAudience.length > 0) {
      where.targetAudience = { [Op.overlap]: filters.targetAudience };
    }

    if (filters?.search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${filters.search}%` } },
        { description: { [Op.iLike]: `%${filters.search}%` } },
        { content: { [Op.iLike]: `%${filters.search}%` } },
      ];
    }

    return this.model.findAll({
      where,
      order: [
        ['viewCount', 'DESC'],
        ['rating', 'DESC'],
        ['createdAt', 'DESC'],
      ],
    });
  }

  async findPopular(limit: number = 10): Promise<Resource[]> {
    return this.model.findAll({
      where: { isActive: true },
      order: [
        ['viewCount', 'DESC'],
        ['rating', 'DESC'],
      ],
      limit,
    });
  }

  async findByCategory(category: string): Promise<Resource[]> {
    return this.model.findAll({
      where: {
        category,
        isActive: true,
      },
      order: [['viewCount', 'DESC']],
    });
  }

  async incrementViewCount(id: string): Promise<void> {
    const resource = await this.findById(id);
    if (resource) {
      resource.viewCount++;
      await resource.save();
    }
  }

  async updateRating(id: string, rating: number): Promise<void> {
    const resource = await this.findById(id);
    if (resource) {
      // Simple average for now - could be enhanced with weighted rating
      const currentRating = resource.rating || 0;
      const newRating = currentRating === 0 ? rating : (currentRating + rating) / 2;
      resource.rating = newRating;
      await resource.save();
    }
  }
}
