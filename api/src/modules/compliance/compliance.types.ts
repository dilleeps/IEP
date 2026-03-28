// src/modules/compliance/compliance.types.ts

export interface CreateComplianceLogDto {
  childId: string;
  serviceDate: Date;
  serviceType: string;
  serviceProvider?: string;
  status: string;
  minutesProvided?: number;
  minutesRequired?: number;
  notes?: string;
  attachments?: any[];
  issueReported?: boolean;
  resolutionStatus?: string;
}

export interface UpdateComplianceLogDto {
  serviceDate?: Date;
  serviceType?: string;
  serviceProvider?: string;
  status?: string;
  minutesProvided?: number;
  minutesRequired?: number;
  notes?: string;
  attachments?: any[];
  issueReported?: boolean;
  resolutionStatus?: string;
}

export interface UpdateStatusDto {
  status: string;
  resolutionStatus?: string;
}

export interface ComplianceLogResponse {
  id: string;
  childId: string;
  serviceDate: string;
  serviceType: string;
  serviceProvider?: string;
  status: string;
  minutesProvided?: number;
  minutesRequired?: number;
  notes?: string;
  attachments: any[];
  issueReported: boolean;
  resolutionStatus?: string;
  createdAt: string;
}

export interface ComplianceFilters {
  childId?: string;
  serviceType?: string;
  status?: string;
  issueReported?: boolean;
}

export interface ComplianceSummaryResponse {
  childId: string;
  totalIssues: number;
  openIssues: number;
  resolvedIssues: number;
  criticalIssues: number;
  complianceScore: number;
  lastCalculated: string;
  issueBreakdown: Record<string, any>;
}
