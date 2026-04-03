// src/modules/admin/analytics/admin-analytics.service.ts
import { AdminAnalyticsRepository } from './admin-analytics.repo.js';
import type {
  UserAnalyticsResponse,
  UserAnalyticsQuery,
  TimeSeriesPoint,
  RecentSignup,
} from './admin-analytics.types.js';

export class AdminAnalyticsService {
  private repo: AdminAnalyticsRepository;

  constructor() {
    this.repo = new AdminAnalyticsRepository();
  }

  async getUserAnalytics(query: UserAnalyticsQuery): Promise<UserAnalyticsResponse> {
    const { from, to } = this.resolveDateRange(query);
    const { previousFrom, previousTo } = this.previousPeriod(from, to);
    const granularity = query.granularity;

    const [
      signupsRaw,
      loginActivityRaw,
      growth,
      activeMetrics,
      inactiveUsers,
      breakdown,
      recentUsers,
      totalUsers,
    ] = await Promise.all([
      this.repo.getSignupsOverTime(from, to, granularity),
      this.repo.getLoginActivity(from, to, granularity),
      this.repo.getGrowthComparison(from, to, previousFrom, previousTo),
      this.repo.getActiveUsersMetrics(),
      this.repo.getInactiveUsersCount(),
      this.repo.getUserBreakdown(),
      this.repo.getRecentSignups(20),
      this.repo.getTotalUsers(),
    ]);

    const signupsOverTime = this.fillDateGaps(signupsRaw, from, to, granularity);
    const loginActivityOverTime = this.fillDateGaps(loginActivityRaw, from, to, granularity);

    const growthRate =
      growth.previous > 0
        ? Math.round(((growth.current - growth.previous) / growth.previous) * 100 * 10) / 10
        : growth.current > 0
          ? 100
          : 0;

    const recentSignups: RecentSignup[] = recentUsers.map((u) => ({
      id: u.id,
      email: u.email,
      displayName: u.displayName,
      role: u.role,
      status: u.status,
      plan: u.subscriptionPlanSlug || null,
      lastLoginAt: u.lastLoginAt ? u.lastLoginAt.toISOString() : null,
      createdAt: u.createdAt.toISOString(),
    }));

    return {
      summary: {
        totalUsers,
        newUsersInPeriod: growth.current,
        growthRate,
        dau: activeMetrics.dau,
        wau: activeMetrics.wau,
        mau: activeMetrics.mau,
        inactiveUsers,
      },
      signupsOverTime,
      loginActivityOverTime,
      breakdown,
      recentSignups,
    };
  }

  private resolveDateRange(query: UserAnalyticsQuery): { from: Date; to: Date } {
    const to = query.to ? new Date(query.to) : new Date();
    if (query.from) {
      return { from: new Date(query.from), to };
    }

    const periodDays: Record<string, number> = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '365d': 365,
    };

    const days = periodDays[query.period];
    if (!days) {
      // 'all' — go back 5 years
      return { from: new Date(to.getTime() - 5 * 365 * 24 * 60 * 60 * 1000), to };
    }

    return { from: new Date(to.getTime() - days * 24 * 60 * 60 * 1000), to };
  }

  private previousPeriod(from: Date, to: Date): { previousFrom: Date; previousTo: Date } {
    const diff = to.getTime() - from.getTime();
    return {
      previousFrom: new Date(from.getTime() - diff),
      previousTo: new Date(from.getTime()),
    };
  }

  private fillDateGaps(
    data: TimeSeriesPoint[],
    from: Date,
    to: Date,
    granularity: 'day' | 'week' | 'month'
  ): TimeSeriesPoint[] {
    const map = new Map<string, number>();
    for (const point of data) {
      map.set(point.date, point.count);
    }

    const result: TimeSeriesPoint[] = [];
    const cursor = new Date(from);
    cursor.setHours(0, 0, 0, 0);

    while (cursor <= to) {
      const key = cursor.toISOString().split('T')[0];
      result.push({ date: key, count: map.get(key) || 0 });

      if (granularity === 'day') {
        cursor.setDate(cursor.getDate() + 1);
      } else if (granularity === 'week') {
        cursor.setDate(cursor.getDate() + 7);
      } else {
        cursor.setMonth(cursor.getMonth() + 1);
      }
    }

    return result;
  }
}
