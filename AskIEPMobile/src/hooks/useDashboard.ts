import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../lib/api-client';
import { API } from '../lib/api-config';
import type { ChildOverview, DashboardSummary } from '../types/domain';

export function useDashboardSummary() {
  return useQuery<DashboardSummary>({
    queryKey: ['dashboard', 'summary'],
    queryFn: () => apiRequest(API.dashboardSummary),
  });
}

export function useChildOverview(childId: string) {
  return useQuery<{success: boolean; data: ChildOverview}>({
    queryKey: ['dashboard', 'overview', childId],
    queryFn: () => apiRequest(API.dashboardOverview(childId)),
    enabled: !!childId,
  });
}
