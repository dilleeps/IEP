// src/modules/admin/analytics/admin-analytics.repo.ts
import { User } from '../../auth/user.model.js';
import { BaseRepo } from '../../../shared/db/base.repo.js';
import { Op, fn, col, literal, cast } from 'sequelize';

export class AdminAnalyticsRepository extends BaseRepo<User> {
  constructor() {
    super(User);
  }

  async getSignupsOverTime(
    from: Date,
    to: Date,
    granularity: 'day' | 'week' | 'month'
  ): Promise<Array<{ date: string; count: number }>> {
    const trunc = granularity === 'day' ? 'day' : granularity === 'week' ? 'week' : 'month';
    const results = await this.model.findAll({
      attributes: [
        [fn('DATE_TRUNC', trunc, col('created_at')), 'date'],
        [fn('COUNT', '*'), 'count'],
      ],
      where: {
        createdAt: { [Op.gte]: from, [Op.lte]: to },
      },
      group: [literal(`DATE_TRUNC('${trunc}', created_at)`)],
      order: [[literal(`DATE_TRUNC('${trunc}', created_at)`), 'ASC']],
      raw: true,
    });

    return (results as any[]).map((r) => ({
      date: new Date(r.date).toISOString().split('T')[0],
      count: parseInt(r.count, 10),
    }));
  }

  async getGrowthComparison(
    currentFrom: Date,
    currentTo: Date,
    previousFrom: Date,
    previousTo: Date
  ): Promise<{ current: number; previous: number }> {
    const [current, previous] = await Promise.all([
      this.model.count({
        where: { createdAt: { [Op.gte]: currentFrom, [Op.lte]: currentTo } },
      }),
      this.model.count({
        where: { createdAt: { [Op.gte]: previousFrom, [Op.lte]: previousTo } },
      }),
    ]);
    return { current, previous };
  }

  async getActiveUsersMetrics(): Promise<{ dau: number; wau: number; mau: number }> {
    const now = new Date();
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [dau, wau, mau] = await Promise.all([
      this.model.count({ where: { lastLoginAt: { [Op.gte]: dayAgo } } }),
      this.model.count({ where: { lastLoginAt: { [Op.gte]: weekAgo } } }),
      this.model.count({ where: { lastLoginAt: { [Op.gte]: monthAgo } } }),
    ]);

    return { dau, wau, mau };
  }

  async getLoginActivity(
    from: Date,
    to: Date,
    granularity: 'day' | 'week' | 'month'
  ): Promise<Array<{ date: string; count: number }>> {
    const trunc = granularity === 'day' ? 'day' : granularity === 'week' ? 'week' : 'month';
    const results = await this.model.findAll({
      attributes: [
        [fn('DATE_TRUNC', trunc, col('last_login_at')), 'date'],
        [fn('COUNT', '*'), 'count'],
      ],
      where: {
        lastLoginAt: { [Op.gte]: from, [Op.lte]: to, [Op.ne]: null as any },
      },
      group: [literal(`DATE_TRUNC('${trunc}', last_login_at)`) as any],
      order: [[literal(`DATE_TRUNC('${trunc}', last_login_at)`) as any, 'ASC']],
      raw: true,
    });

    return (results as any[]).map((r) => ({
      date: new Date(r.date).toISOString().split('T')[0],
      count: parseInt(r.count, 10),
    }));
  }

  async getInactiveUsersCount(): Promise<number> {
    const threshold = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    return this.model.count({
      where: {
        [Op.or]: [
          { lastLoginAt: { [Op.is]: null as any } },
          { lastLoginAt: { [Op.lt]: threshold } },
        ],
      },
    });
  }

  async getUserBreakdown(): Promise<{
    byRole: Array<{ name: string; count: number }>;
    byStatus: Array<{ name: string; count: number }>;
    byPlan: Array<{ name: string; count: number }>;
  }> {
    const [byRole, byStatus, byPlan] = await Promise.all([
      this.model.findAll({
        attributes: ['role', [fn('COUNT', '*'), 'count']],
        group: ['role'],
        raw: true,
      }),
      this.model.findAll({
        attributes: ['status', [fn('COUNT', '*'), 'count']],
        group: ['status'],
        raw: true,
      }),
      this.model.findAll({
        attributes: [
          [col('subscription_plan_slug'), 'plan'],
          [fn('COUNT', '*'), 'count'],
        ],
        group: ['subscription_plan_slug'],
        raw: true,
      }),
    ]);

    return {
      byRole: (byRole as any[]).map((r) => ({ name: r.role, count: parseInt(r.count, 10) })),
      byStatus: (byStatus as any[]).map((r) => ({ name: r.status, count: parseInt(r.count, 10) })),
      byPlan: (byPlan as any[]).map((r) => ({
        name: r.plan || 'none',
        count: parseInt(r.count, 10),
      })),
    };
  }

  async getRecentSignups(limit: number = 20): Promise<User[]> {
    return this.model.findAll({
      order: [['created_at', 'DESC']],
      limit,
      attributes: { exclude: ['passwordHash'] },
    });
  }

  async getTotalUsers(): Promise<number> {
    return this.model.count();
  }
}
