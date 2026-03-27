import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../lib/api-client';
import { API } from '../lib/api-config';
import type { Child, CreateChildDto } from '../types/domain';

export function useChildren() {
  return useQuery<{children: Child[]}>({
    queryKey: ['children'],
    queryFn: () => apiRequest(API.children),
  });
}

export function useChild(id: string) {
  return useQuery<Child>({
    queryKey: ['children', id],
    queryFn: () => apiRequest(API.child(id)),
    enabled: !!id,
  });
}

export function useCreateChild() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateChildDto) =>
      apiRequest(API.children, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['children']});
      queryClient.invalidateQueries({queryKey: ['dashboard']});
    },
  });
}

export function useUpdateChild() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({id, data}: {id: string; data: Partial<CreateChildDto>}) =>
      apiRequest(API.child(id), {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({queryKey: ['children']});
      queryClient.invalidateQueries({queryKey: ['children', variables.id]});
      queryClient.invalidateQueries({queryKey: ['dashboard']});
    },
  });
}

export function useDeleteChild() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiRequest(API.child(id), {method: 'DELETE'}),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['children']});
      queryClient.invalidateQueries({queryKey: ['dashboard']});
    },
  });
}
