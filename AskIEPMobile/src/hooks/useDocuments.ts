import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../lib/api-client';
import { API } from '../lib/api-config';

export interface IEPDocument {
  id: string;
  fileName: string;
  documentType: string;
  childId: string;
  status: 'uploaded' | 'analyzing' | 'analyzed' | 'error';
  uploadDate: string;
  fileSize?: number;
}

export interface IEPExtraction {
  goals: {
    id: string;
    description: string;
    domain: string;
    confidence: number;
  }[];
  services: {
    id: string;
    name: string;
    frequency: string;
    confidence: number;
  }[];
  accommodations: {
    id: string;
    description: string;
    confidence: number;
  }[];
  redFlags: {
    id: string;
    description: string;
    severity: 'high' | 'medium' | 'low';
  }[];
}

export function useIEPDocuments(childId?: string) {
  const url = childId ? `${API.iepList}?childId=${childId}` : API.iepList;
  return useQuery<{documents: IEPDocument[]}>({
    queryKey: ['iep-documents', childId],
    queryFn: () => apiRequest(url),
  });
}

export function useIEPDocument(id: string) {
  return useQuery<IEPDocument>({
    queryKey: ['iep-document', id],
    queryFn: () => apiRequest(API.iep(id)),
    enabled: !!id,
  });
}

export function useIEPExtraction(id: string) {
  return useQuery<IEPExtraction>({
    queryKey: ['iep-extraction', id],
    queryFn: () => apiRequest(API.iepExtraction(id)),
    enabled: !!id,
  });
}
