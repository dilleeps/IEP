export const CONSULTATION_STATUSES = [
  'BOOKED',
  'CONFIRMED',
  'COMPLETED',
  'CANCELLED',
  'NO_SHOW',
] as const;

export type ConsultationStatus = (typeof CONSULTATION_STATUSES)[number];

export const CONCERN_AREAS = [
  'General IEP Consultation',
  'IEP Review & Analysis',
  'Goal Setting & Progress',
  'Behavior Support',
  'Transition Planning',
  'Due Process & Compliance',
  'School Communication',
  'Accommodation Strategies',
  'Other',
] as const;

export type ConcernArea = (typeof CONCERN_AREAS)[number];

// Expert email used for consultation notifications
export const EXPERT_CONSULTATION_EMAIL = 'Dilleeps@gmail.com';

export interface CreateConsultationSlotDto {
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  durationMinutes?: number;
}

export interface CreateConsultationDto {
  slotId: string;
  childId: string;
  concernArea?: string;
  notes?: string;
}

export interface UpdateConsultationDto {
  status?: ConsultationStatus;
  expertNotes?: string;
  meetLink?: string;
}

export interface CancelConsultationDto {
  reason?: string;
}

export interface ConsultationSlotResponse {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  isAvailable: boolean;
}

export interface ConsultationResponse {
  id: string;
  parentUserId: string;
  childId: string;
  slotId: string;
  parentName: string;
  parentEmail: string;
  childName: string;
  concernArea: string;
  notes: string;
  status: ConsultationStatus;
  meetLink: string | null;
  expertNotes: string;
  slot: ConsultationSlotResponse | null;
  createdAt: string;
  updatedAt: string;
  cancelledAt: string | null;
}

export interface AvailableSlotsQueryDto {
  date?: string; // YYYY-MM-DD — returns slots for this date
  from?: string; // YYYY-MM-DD — range start
  to?: string; // YYYY-MM-DD — range end
}
