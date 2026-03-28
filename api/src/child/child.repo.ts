import { ChildProfile } from './child.model.js';
import { BaseRepo } from '../shared/db/base.repo.js';

export class ChildRepository extends BaseRepo<ChildProfile> {
  constructor() {
    super(ChildProfile);
  }

  async findByUserId(userId: string, includeInactive = false): Promise<ChildProfile[]> {
    const where: any = { userId };
    if (!includeInactive) {
      where.isActive = true;
    }

    return this.model.findAll({
      where,
      order: [['createdAt', 'DESC']],
    });
  }

  async countByUserId(userId: string): Promise<number> {
    return this.model.count({
      where: { userId, isActive: true },
    });
  }

  async update(id: string, data: any): Promise<ChildProfile> {
    await this.model.update(data, { where: { id } });
    const updated = await this.findById(id);
    if (!updated) {
      throw new Error('Child not found after update');
    }
    return updated;
  }

  async softDelete(id: string): Promise<void> {
    await this.model.destroy({ where: { id } });
  }
}
