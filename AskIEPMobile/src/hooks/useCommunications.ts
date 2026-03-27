import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../lib/api-client';
import { API } from '../lib/api-config';

export interface Contact {
  id: string;
  name: string;
  role: string;
  email?: string;
  phone?: string;
  childId: string;
}

export interface Communication {
  id: string;
  contactId?: string;
  childId: string;
  type: string;
  date: string;
  subject: string;
  notes: string;
  followUpDate?: string;
  createdAt: string;
}

export function useContacts(childId: string) {
  return useQuery<{contacts: Contact[]}>({
    queryKey: ['contacts', childId],
    queryFn: () => apiRequest(API.contacts(childId)),
    enabled: !!childId,
  });
}

export function useCommunications(childId: string) {
  return useQuery<{communications: Communication[]}>({
    queryKey: ['communications', childId],
    queryFn: () => apiRequest(API.communications(childId)),
    enabled: !!childId,
  });
}

export function useCreateCommunication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Communication, 'id' | 'createdAt'>) =>
      apiRequest(API.communications(data.childId), {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['communications']});
      queryClient.invalidateQueries({queryKey: ['dashboard']});
    },
  });
}
