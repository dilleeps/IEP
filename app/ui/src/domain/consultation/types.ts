export type ConsultationStatus = 'BOOKED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';

export interface ConsultationSlot {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  isAvailable: boolean;
}

export interface ConsultationItem {
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
  slot: ConsultationSlot | null;
  createdAt: string;
  updatedAt: string;
  cancelledAt: string | null;
}

export interface BookConsultationPayload {
  slotId: string;
  childId: string;
  concernArea?: string;
  notes?: string;
}

export const CONCERN_AREAS = [
  'General IEP Consultation',
  'IEP Review & Analysis',
  'Goal Setting & Progress',
  'Behavior Support',
  'Transition Planning',
  'Understanding Your Options',
  'School Communication',
  'Accommodation Strategies',
  'Other',
] as const;
