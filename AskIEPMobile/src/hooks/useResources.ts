import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../lib/api-client';
import { API } from '../lib/api-config';

export interface Resource {
  id: string;
  title: string;
  description: string;
  category: string;
  url: string;
  isBookmarked?: boolean;
}

export const useResources = (category?: string) => {
  const url = category
    ? `${API.resources}?category=${encodeURIComponent(category)}`
    : API.resources;

  return useQuery({
    queryKey: ['resources', category],
    queryFn: () => apiRequest<{resources: Resource[]}>(url),
  });
};

export const useBookmarkedResources = () => {
  return useQuery({
    queryKey: ['resources', 'bookmarked'],
    queryFn: () =>
      apiRequest<{resources: Resource[]}>(`${API.resources}?bookmarked=true`),
  });
};

export const useToggleBookmark = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({id, bookmarked}: {id: string; bookmarked: boolean}) =>
      apiRequest(`${API.resources}/${id}/bookmark`, {
        method: bookmarked ? 'DELETE' : 'POST',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['resources']});
    },
  });
};
