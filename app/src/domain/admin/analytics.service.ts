import { apiRequest } from '@/lib/http';
import { config } from '@/lib/config';
import type { UserAnalyticsResponse, UserAnalyticsParams } from './analytics.types';

const getToken = () => {
  try {
    const sessionData = sessionStorage.getItem('askiep.session');
    if (!sessionData) return '';
    const session = JSON.parse(sessionData);
    return session?.accessToken || '';
  } catch {
    return '';
  }
};

export const analyticsService = {
  async getUserAnalytics(params: UserAnalyticsParams): Promise<UserAnalyticsResponse> {
    const query = new URLSearchParams({
      period: params.period,
      granularity: params.granularity,
    });
    return apiRequest<UserAnalyticsResponse>(
      `${config.api.endpoints.admin.analytics}?${query.toString()}`,
      { token: getToken() }
    );
  },
};
