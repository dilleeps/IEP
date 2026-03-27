import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../lib/api-client';
import { API } from '../lib/api-config';

export interface ServiceCompliance {
  id: string;
  name: string;
  frequency: string;
  met: number;
  missed: number;
  upcoming: number;
  childId: string;
}

export interface ComplianceEntry {
  id: string;
  childId: string;
  serviceType: string;
  serviceProvider: string;
  serviceDate: string;
  status: 'provided' | 'scheduled' | 'missed';
  minutesProvided?: number;
  minutesRequired?: number;
  notes?: string;
  createdAt: string;
}

export interface CreateComplianceDto {
  childId: string;
  serviceType: string;
  serviceProvider: string;
  serviceDate: string;
  status: 'provided' | 'scheduled' | 'missed';
  minutesProvided?: number;
  minutesRequired?: number;
  notes?: string;
}

export function useServices(childId: string) {
  return useQuery<{services: ServiceCompliance[]}>({
    queryKey: ['services', childId],
    queryFn: () => apiRequest(API.services(childId)),
    enabled: !!childId,
  });
}

export function useCreateService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateComplianceDto) =>
      apiRequest(API.servicesCreate, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['services']});
      queryClient.invalidateQueries({queryKey: ['dashboard']});
    },
  });
}

export function useUpdateService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({id, data}: {id: string; data: Partial<ComplianceEntry>}) =>
      apiRequest(API.service(id), {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['services']});
    },
  });
}

export function useDeleteService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiRequest(API.service(id), {method: 'DELETE'}),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['services']});
    },
  });
}
