export interface CounselorDirectoryItem {
  id: string;
  displayName: string;
  bio: string;
  credentials: string;
  specializations: string[];
  timezone: string;
}

export interface CounselorServiceItem {
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

export interface CounselorAvailabilityWindow {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
  label: string;
}

export interface SaveCounselorServicePayload {
  name: string;
  serviceType: string;
  durationMinutes: number;
  priceCents: number | null;
  paymentRequired: boolean;
  description: string;
}

export interface ReplaceAvailabilityPayload {
  windows: Array<{
    day: string;
    startTime: string;
    endTime: string;
    label?: string;
  }>;
}

export interface CounselorServiceCategory {
  id: string;
  department: string;
  examples: string;
  iconKey: string;
}

export interface CounselorServiceTemplate {
  id: string;
  name: string;
  serviceType: string;
  durationMinutes: number;
  priceCents: number | null;
  paymentRequired: boolean;
  description: string;
}

export interface CounselorServiceMetadata {
  categories: CounselorServiceCategory[];
  templates: CounselorServiceTemplate[];
  durations: number[];
  customOption: string;
  filterAllLabel: string;
}

export interface CounselorProfile {
  userId: string;
  bio: string;
  timezone: string;
  credentials: string;
  specializations: string[];
  paymentEnabled: boolean;
  googleConnected: boolean;
  updatedAt: string;
}

export interface CounselorGoogleConnectUrlResponse {
  url: string;
}

export interface UpdateCounselorProfilePayload {
  bio?: string;
  timezone?: string;
  credentials?: string;
  specializations?: string[];
  paymentEnabled?: boolean;
  googleConnected?: boolean;
}

export type CounselorPaymentStatus = "NOT_REQUIRED" | "PENDING" | "PAID";
export type CounselorAppointmentStatus = "REQUESTED" | "ACCEPTED" | "WAITLISTED" | "COMPLETED" | "CANCELLED";

export interface CounselorAppointmentItem {
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

export interface UpdateCounselorAppointmentStatusPayload {
  status: CounselorAppointmentStatus;
}

export interface UpdateCounselorAppointmentPayload {
  status?: CounselorAppointmentStatus;
  scheduledAt?: string | null;
  counselorMessage?: string;
}

export interface CounselorCatalogServiceItem {
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

export interface CreateCounselorAppointmentPayload {
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

export interface CounselorCatalogSlotAvailability {
  date: string;
  day: string;
  counselorId: string;
  counselorServiceId: string | null;
  serviceDurationMinutes: number;
  availableSlots: string[];
}

export interface UpdateMyCounselorAppointmentPayload {
  scheduledAt?: string | null;
  notes?: string;
  cancel?: boolean;
}

export interface ConfirmDummyCounselorPaymentPayload {
  paymentSessionId?: string;
  dummyTransactionRef?: string;
}

export interface CounselorPaymentSession {
  appointmentId: string;
  sessionId: string;
  gateway: 'mock';
  status: 'created';
  amountCents: number;
  currency: string;
  checkoutUrl: string;
  expiresAt: string;
}
