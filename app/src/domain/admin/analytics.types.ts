export interface TimeSeriesPoint {
  date: string;
  count: number;
}

export interface BreakdownItem {
  name: string;
  count: number;
}

export interface AnalyticsSummary {
  totalUsers: number;
  newUsersInPeriod: number;
  growthRate: number;
  dau: number;
  wau: number;
  mau: number;
  inactiveUsers: number;
}

export interface RecentSignup {
  id: string;
  email: string;
  displayName: string;
  role: string;
  status: string;
  plan: string | null;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface UserAnalyticsResponse {
  summary: AnalyticsSummary;
  signupsOverTime: TimeSeriesPoint[];
  loginActivityOverTime: TimeSeriesPoint[];
  breakdown: {
    byRole: BreakdownItem[];
    byStatus: BreakdownItem[];
    byPlan: BreakdownItem[];
  };
  recentSignups: RecentSignup[];
}

export interface UserAnalyticsParams {
  period: string;
  granularity: string;
}
