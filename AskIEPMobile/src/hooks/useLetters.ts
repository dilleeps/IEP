import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../lib/api-client';
import { API } from '../lib/api-config';
import type { CreateLetterDto, Letter } from '../types/domain';

export function useLetters(childId?: string) {
  return useQuery<{letters: Letter[]}>({
    queryKey: ['letters', childId],
    queryFn: () => {
      const url = childId ? `${API.letters}?childId=${childId}` : API.letters;
      return apiRequest(url);
    },
  });
}

export function useLetter(id: string) {
  return useQuery<{letter: Letter}>({
    queryKey: ['letter', id],
    queryFn: () => apiRequest(API.letter(id)),
    enabled: !!id,
  });
}

export function useCreateLetter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateLetterDto) =>
      apiRequest(API.letters, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['letters']});
    },
  });
}

export function useUpdateLetter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({id, data}: {id: string; data: Partial<Letter>}) =>
      apiRequest(API.letter(id), {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['letters']});
      queryClient.invalidateQueries({queryKey: ['letter']});
    },
  });
}

export function useDeleteLetter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiRequest(API.letter(id), {method: 'DELETE'}),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['letters']});
    },
  });
}

export function useGenerateLetterDraft() {
  return useMutation({
    mutationFn: (data: {
      childId: string;
      letterType: string;
      context: string;
    }) =>
      apiRequest<{content: string}>(API.letterGenerate, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  });
}
