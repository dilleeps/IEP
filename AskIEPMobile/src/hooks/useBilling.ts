import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../lib/api-client';
import { API } from '../lib/api-config';
import type { Plan } from '../types/domain';

export function usePlans() {
  return useQuery<{plans: Plan[]}>({
    queryKey: ['plans'],
    queryFn: () => apiRequest(API.plans),
  });
}

export function useSubscribe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {planId: string; interval: 'monthly' | 'yearly'}) =>
      apiRequest(API.subscribe, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['plans']});
      queryClient.invalidateQueries({queryKey: ['profile']});
    },
  });
}
