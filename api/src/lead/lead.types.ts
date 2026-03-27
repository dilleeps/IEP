export interface CreateLeadRequest {
  email: string;
  recaptchaToken: string;
  recaptchaAction?: string;
}

export interface ListLeadsQuery {
  limit?: number;
  offset?: number;
  format?: 'json' | 'csv';
}

export interface LeadResponse {
  id: string;
  email: string;
  ip?: string;
  userAgent?: string;
  captchaScore?: number;
  captchaAction?: string;
  createdAt: Date;
}

export interface LeadsListResponse {
  leads: LeadResponse[];
  total: number;
  limit: number;
  offset: number;
}

export interface RecaptchaVerifyResponse {
  success: boolean;
  score?: number;
  action?: string;
  challenge_ts?: string;
  hostname?: string;
  'error-codes'?: string[];
}
