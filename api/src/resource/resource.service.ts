// src/modules/resource/resource.service.ts
import { Resource } from './resource.model.js';
import { ResourceRepository } from './resource.repo.js';
import { CreateResourceDto, UpdateResourceDto, ResourceFiltersDto } from './resource.types.js';
import { AppError } from '../shared/errors/appError.js';

export class ResourceService {
  private repo: ResourceRepository;

  constructor() {
    this.repo = new ResourceRepository();
  }

  async create(data: CreateResourceDto, createdBy?: string): Promise<Resource> {
    return this.repo.create({
      ...data,
      tags: data.tags || [],
      targetAudience: data.targetAudience || [],
      isActive: true,
      viewCount: 0,
      createdBy,
    } as any);
  }

  async findAll(filters?: ResourceFiltersDto): Promise<Resource[]> {
    return this.repo.findAllFiltered(filters);
  }

  async findPopular(limit?: number): Promise<Resource[]> {
    return this.repo.findPopular(limit);
  }

  async findByCategory(category: string): Promise<Resource[]> {
    return this.repo.findByCategory(category);
  }

  async findById(id: string, incrementView: boolean = false): Promise<Resource> {
    const resource = await this.repo.findById(id);
    if (!resource) {
      throw new AppError('Resource not found', 404, 'RESOURCE_NOT_FOUND');
    }

    // Optionally increment view count
    if (incrementView && resource.isActive) {
      await this.repo.incrementViewCount(id);
      resource.viewCount++;
    }

    return resource;
  }

  async update(id: string, data: UpdateResourceDto): Promise<Resource> {
    await this.findById(id);
    return this.repo.update(id, data);
  }

  async rate(id: string, rating: number): Promise<void> {
    await this.findById(id);
    await this.repo.updateRating(id, rating);
  }

  async delete(id: string): Promise<void> {
    await this.findById(id);
    await this.repo.softDelete(id);
  }
}
