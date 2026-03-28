// src/modules/plans/plan.repo.ts
import { Op } from 'sequelize';
import { SubscriptionPlan, SubscriptionPlanAttributes } from './plan.model.js';

export class PlanRepository {
  async findAll(activeOnly = false): Promise<SubscriptionPlan[]> {
    return SubscriptionPlan.findAll({
      where: activeOnly ? { isActive: true } : {},
      order: [['sortOrder', 'ASC']],
    });
  }

  async findById(id: string): Promise<SubscriptionPlan | null> {
    return SubscriptionPlan.findByPk(id);
  }

  async findBySlug(slug: string): Promise<SubscriptionPlan | null> {
    return SubscriptionPlan.findOne({ where: { slug } });
  }

  async create(data: Omit<SubscriptionPlanAttributes, 'createdAt' | 'updatedAt' | 'deletedAt'>): Promise<SubscriptionPlan> {
    return SubscriptionPlan.create({ ...data, createdAt: new Date(), updatedAt: new Date() } as any);
  }

  async update(id: string, data: Partial<SubscriptionPlanAttributes>): Promise<SubscriptionPlan | null> {
    const plan = await SubscriptionPlan.findByPk(id);
    if (!plan) return null;
    return plan.update(data);
  }

  async delete(id: string): Promise<boolean> {
    const plan = await SubscriptionPlan.findByPk(id);
    if (!plan) return false;
    await plan.destroy();
    return true;
  }
}
