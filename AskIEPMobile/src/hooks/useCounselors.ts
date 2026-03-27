import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../lib/api-client';
import { API } from '../lib/api-config';
import type { Appointment, CounselorService, CounselorSlot } from '../types/domain';

export function useCounselorCatalog() {
  return useQuery<{services: CounselorService[]}>({
    queryKey: ['counselor-catalog'],
    queryFn: () => apiRequest(API.counselorCatalog),
  });
}

export function useCounselorSlots(counselorId: string, serviceId: string) {
  return useQuery<{slots: CounselorSlot[]}>({
    queryKey: ['counselor-slots', counselorId, serviceId],
    queryFn: () => apiRequest(API.counselorSlots(counselorId, serviceId)),
    enabled: !!counselorId && !!serviceId,
  });
}

export function useMyAppointments() {
  return useQuery<{appointments: Appointment[]}>({
    queryKey: ['my-appointments'],
    queryFn: () => apiRequest(API.counselorAppointments),
  });
}

export function useCreateAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      serviceId: string;
      counselorId: string;
      slotId: string;
      notes?: string;
    }) =>
      apiRequest(API.counselorCreateAppointment, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['my-appointments']});
      queryClient.invalidateQueries({queryKey: ['counselor-slots']});
    },
  });
}

export function useCancelAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiRequest(API.counselorAppointment(id), {
        method: 'PATCH',
        body: JSON.stringify({status: 'CANCELLED'}),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['my-appointments']});
    },
  });
}
