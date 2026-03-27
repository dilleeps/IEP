import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../lib/api-client';
import { API } from '../lib/api-config';

export interface Goal {
  id: string;
  goalName: string;
  description?: string;
  domain: string;
  progressPercentage: number;
  status: string;
  childId: string;
  baseline?: number;
  target?: number;
  current?: number;
  metric?: string;
  startDate?: string;
  targetDate?: string;
  createdAt: string;
}

export interface GoalProgress {
  id: string;
  goalId: string;
  date: string;
  notes: string;
  status: string;
}

export interface CreateGoalDto {
  childId: string;
  goalName: string;
  description?: string;
  domain: string;
  baseline?: number;
  target?: number;
  metric?: string;
  startDate?: string;
  targetDate?: string;
}

export function useGoals(childId: string) {
  return useQuery<{goals: Goal[]}>({
    queryKey: ['goals', childId],
    queryFn: () => apiRequest(API.goals(childId)),
    enabled: !!childId,
  });
}

export function useGoalProgress(goalId: string) {
  return useQuery<{progress: GoalProgress[]}>({
    queryKey: ['goal-progress', goalId],
    queryFn: () => apiRequest(API.goalProgress(goalId)),
    enabled: !!goalId,
  });
}

export function useCreateGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateGoalDto) =>
      apiRequest(API.goalsCreate, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['goals']});
      queryClient.invalidateQueries({queryKey: ['dashboard']});
    },
  });
}

export function useUpdateGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({id, data}: {id: string; data: Partial<Goal>}) =>
      apiRequest(API.goal(id), {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['goals']});
      queryClient.invalidateQueries({queryKey: ['dashboard']});
    },
  });
}

export function useDeleteGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiRequest(API.goal(id), {method: 'DELETE'}),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['goals']});
      queryClient.invalidateQueries({queryKey: ['dashboard']});
    },
  });
}

export function useAddGoalProgress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({goalId, data}: {goalId: string; data: {date: string; notes: string}}) =>
      apiRequest(API.goalProgress(goalId), {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({queryKey: ['goal-progress', variables.goalId]});
      queryClient.invalidateQueries({queryKey: ['goals']});
    },
  });
}
