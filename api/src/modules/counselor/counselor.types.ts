export const COUNSELOR_DAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const;

export const COUNSELOR_APPOINTMENT_STATUSES = [
  'REQUESTED',
  'ACCEPTED',
  'WAITLISTED',
  'COMPLETED',
  'CANCELLED',
] as const;

export const COUNSELOR_PAYMENT_STATUSES = [
  'NOT_REQUIRED',
  'PENDING',
  'PAID',
] as const;

export type CounselorDay = (typeof COUNSELOR_DAYS)[number];
export type CounselorAppointmentStatus = (typeof COUNSELOR_APPOINTMENT_STATUSES)[number];
export type CounselorPaymentStatus = (typeof COUNSELOR_PAYMENT_STATUSES)[number];

export interface CreateCounselorServiceDto {
  name: string;
  serviceType: string;
  durationMinutes: number;
  priceCents: number | null;
  paymentRequired: boolean;
  description?: string;
}

export interface UpdateCounselorServiceDto extends Partial<CreateCounselorServiceDto> {}

export interface ReplaceAvailabilityWindowDto {
  day: CounselorDay;
  startTime: string;
  endTime: string;
  label?: string;
}

export interface ReplaceAvailabilityDto {
  windows: ReplaceAvailabilityWindowDto[];
}

export interface UpdateCounselorProfileDto {
  bio?: string;
  timezone?: string;
  credentials?: string;
  specializations?: string[];
  paymentEnabled?: boolean;
  googleConnected?: boolean;
}

export interface UpdateCounselorAppointmentStatusDto {
  status: CounselorAppointmentStatus;
}

export interface UpdateCounselorAppointmentDto {
  status?: CounselorAppointmentStatus;
  scheduledAt?: string | null;
  counselorMessage?: string;
}

export interface CreateCounselorAppointmentDto {
  counselorServiceId?: string;
  counselorId?: string;
  serviceName?: string;
  durationMinutes?: number;
  childId: string;
  iepDocumentId?: string | null;
  supportingDocumentIds?: string[];
  scheduledAt?: string | null;
  notes?: string;
}

export interface ListCatalogSlotsQueryDto {
  date: string;
}

export interface CatalogSlotAvailabilityResponse {
  date: string;
  day: CounselorDay;
  counselorId: string;
  counselorServiceId: string | null;
  serviceDurationMinutes: number;
  availableSlots: string[];
}

export interface UpdateParentCounselorAppointmentDto {
  scheduledAt?: string | null;
  notes?: string;
  cancel?: boolean;
}

export interface MarkParentCounselorAppointmentPaidDto {
  paymentSessionId?: string;
  dummyTransactionRef?: string;
}

export interface ParentCounselorPaymentSessionResponse {
  appointmentId: string;
  sessionId: string;
  gateway: 'mock';
  status: 'created';
  amountCents: number;
  currency: string;
  checkoutUrl: string;
  expiresAt: string;
}

export interface GoogleOAuthCallbackQueryDto {
  code: string;
  state: string;
}

export interface CounselorServiceResponse {
  id: string;
  name: string;
  serviceType: string;
  durationMinutes: number;
  priceCents: number | null;
  paymentRequired: boolean;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface AvailabilityWindowResponse {
  id: string;
  day: CounselorDay;
  startTime: string;
  endTime: string;
  label: string;
}

export interface CounselorProfileResponse {
  userId: string;
  bio: string;
  timezone: string;
  credentials: string;
  specializations: string[];
  paymentEnabled: boolean;
  googleConnected: boolean;
  updatedAt: string;
}

export interface CounselorServiceCategoryResponse {
  id: string;
  department: string;
  examples: string;
  iconKey: string;
}

export interface CounselorServiceTemplateResponse {
  id: string;
  name: string;
  serviceType: string;
  durationMinutes: number;
  priceCents: number | null;
  paymentRequired: boolean;
  description: string;
}

export interface CounselorServiceMetadataResponse {
  categories: CounselorServiceCategoryResponse[];
  templates: CounselorServiceTemplateResponse[];
  durations: number[];
  customOption: string;
  filterAllLabel: string;
}

export interface CounselorAppointmentResponse {
  id: string;
  childId: string;
  counselorId: string;
  counselorServiceId: string | null;
  iepDocumentId: string | null;
  supportingDocumentIds: string[];
  parentName: string;
  childName: string;
  serviceName: string;
  durationMinutes: number;
  scheduledAt: string | null;
  status: CounselorAppointmentStatus;
  paymentStatus: CounselorPaymentStatus;
  paymentReference: string | null;
  meetLink: string | null;
  calendarEventId: string | null;
  counselorMessage: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface CounselorDirectoryItemResponse {
  id: string;
  displayName: string;
  bio: string;
  credentials: string;
  specializations: string[];
  timezone: string;
}

export interface CounselorCatalogServiceResponse {
  id: string;
  name: string;
  serviceType: string;
  durationMinutes: number;
  priceCents: number | null;
  paymentRequired: boolean;
  description: string;
  counselor: {
    id: string;
    displayName: string;
    bio: string;
    credentials: string;
    specializations: string[];
    timezone: string;
    paymentEnabled: boolean;
    googleConnected: boolean;
  };
}

export interface CounselorGoogleConnectUrlResponse {
  url: string;
}
