import { ChildProfile } from './child.model.js';
import { ChildRepository } from './child.repo.js';
import { CreateChildDto, UpdateChildDto } from './child.types.js';
import { AppError } from '../../shared/errors/appError.js';

export class ChildService {
  constructor(private repo: ChildRepository) {}

  async create(userId: string, data: CreateChildDto): Promise<ChildProfile> {
    return this.repo.create({
      ...data,
      userId,
      isActive: true,
      focusTags: data.focusTags || [],
      reminderPreferences: data.reminderPreferences || {},
    } as any);
  }

  async findByUserId(userId: string, includeInactive = false): Promise<ChildProfile[]> {
    return this.repo.findByUserId(userId, includeInactive);
  }

  async findById(id: string): Promise<ChildProfile> {
    const child = await this.repo.findById(id);
    if (!child) {
      throw new AppError('Child not found', 404, 'CHILD_NOT_FOUND');
    }
    return child;
  }

  async update(id: string, data: UpdateChildDto): Promise<ChildProfile> {
    const child = await this.findById(id);
    return this.repo.update(id, data);
  }

  async softDelete(id: string): Promise<void> {
    await this.findById(id);
    await this.repo.softDelete(id);
  }

  async verifyOwnership(childId: string, userId: string): Promise<boolean> {
    const child = await this.repo.findById(childId);
    return child?.userId === userId;
  }
}

// Export standalone function for middleware
export async function verifyOwnership(childId: string, userId: string): Promise<boolean> {
  const service = new ChildService(new ChildRepository());
  return service.verifyOwnership(childId, userId);
}
