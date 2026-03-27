import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../lib/api-client';
import { API } from '../lib/api-config';
import type { Consultation, ConsultationSlot } from '../types/domain';

export function useConsultationSlots(date?: string) {
  return useQuery<{slots: ConsultationSlot[]}>({
    queryKey: ['consultation-slots', date],
    queryFn: () => {
      const url = date ? `${API.consultationSlots}?date=${date}` : API.consultationSlots;
      return apiRequest(url);
    },
  });
}

export function useMyConsultations() {
  return useQuery<{consultations: Consultation[]}>({
    queryKey: ['my-consultations'],
    queryFn: () => apiRequest(API.consultations),
  });
}

export function useBookConsultation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      slotId: string;
      concernArea: string;
      notes?: string;
      childId?: string;
    }) =>
      apiRequest(API.consultationBook, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['my-consultations']});
      queryClient.invalidateQueries({queryKey: ['consultation-slots']});
    },
  });
}

export function useCancelConsultation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiRequest(API.consultationCancel(id), {method: 'POST'}),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['my-consultations']});
    },
  });
}
