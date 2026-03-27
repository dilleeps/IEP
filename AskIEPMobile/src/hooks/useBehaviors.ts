import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../lib/api-client';
import { API } from '../lib/api-config';

export interface BehaviorEntry {
  id: string;
  childId: string;
  date: string;
  antecedent: string;
  behavior: string;
  consequence: string;
  notes?: string;
  createdAt: string;
}

export function useBehaviors(childId: string) {
  return useQuery<{behaviors: BehaviorEntry[]}>({
    queryKey: ['behaviors', childId],
    queryFn: () => apiRequest(API.behaviors(childId)),
    enabled: !!childId,
  });
}

export function useCreateBehavior() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<BehaviorEntry, 'id' | 'createdAt'>) =>
      apiRequest(API.behaviors(data.childId), {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['behaviors']});
    },
  });
}

export function useDeleteBehavior() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiRequest(API.behavior(id), {method: 'DELETE'}),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['behaviors']});
    },
  });
}
