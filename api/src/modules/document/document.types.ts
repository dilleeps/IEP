export interface CreateDocumentDto {
  childId: string;
  fileName: string;
  originalFileName: string;
  fileSize: number;
  mimeType: string;
  storagePath: string;
  documentType: 'current_iep' | 'previous_iep' | 'progress_report' | 'evaluation' | 'other';
  metadata?: Record<string, any>;
}

export interface UpdateDocumentDto {
  documentType?: 'current_iep' | 'previous_iep' | 'progress_report' | 'evaluation' | 'other';
  metadata?: Record<string, any>;
}

export interface DocumentResponse {
  id: string;
  childId: string;
  fileName: string;
  originalFileName: string;
  fileSize: number;
  mimeType: string;
  documentType: string;
  status: string;
  analysisStatus?: string;
  uploadDate: string;
  metadata: Record<string, any>;
  createdAt: string;
}

export interface AnalysisResponse {
  id: string;
  documentId: string;
  analysisDate: string;
  strengths: string[];
  concerns: string[];
  recommendations: string[];
  complianceIssues: string[];
  complianceScore?: number;
  summary: string;
  aiInsights: Record<string, any>;
}
