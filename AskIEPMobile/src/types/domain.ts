export interface Child {
  id: string;
  name: string;
  age?: number;
  grade?: string;
  schoolName?: string;
  schoolDistrict?: string;
  disabilities?: string[];
  focusTags?: string[];
  lastIepDate?: string;
  nextIepReviewDate?: string;
  advocacyLevel?: 'Beginner' | 'Intermediate' | 'Advanced';
  primaryGoal?: string;
  stateContext?: string;
  isActive: boolean;
  createdAt: string;
}

export interface CreateChildDto {
  name: string;
  dateOfBirth?: string;
  age?: number;
  grade?: string;
  schoolName?: string;
  schoolDistrict?: string;
  disabilities?: string[];
  focusTags?: string[];
  advocacyLevel?: 'Beginner' | 'Intermediate' | 'Advanced';
  primaryGoal?: string;
  stateContext?: string;
}

export interface DashboardSummary {
  children: {total: number; active: number};
  upcomingDeadlines: {
    id: string;
    childId: string;
    childName: string;
    type: string;
    title: string;
    date: string;
    daysUntil: number;
  }[];
  advocacyAlerts: {
    total: number;
    byPriority: {high: number; medium: number; low: number};
  };
  recentActivity: {
    id: string;
    type: string;
    title: string;
    childName: string;
    date: string;
  }[];
  advocacyQuote?: string;
  statistics: {
    totalGoals: number;
    goalsInProgress: number;
    totalCommunications: number;
    pendingFollowUps: number;
    recentContactsCount: number;
  };
}

export interface ChildOverview {
  child: {
    id: string;
    name: string;
    grade: string;
    school: string;
    disabilities: string[];
  };
  complianceHealth: {
    serviceDeliveryPercentage: number;
    totalMissedSessions: number;
    reviewStatus: 'on_track' | 'due_soon' | 'overdue';
  };
  goalMastery: {
    masteredGoals: number;
    progressingGoals: number;
    emergingGoals: number;
    notStartedGoals: number;
    averageProgress: number;
  };
  recentDocuments: {
    id: string;
    fileName: string;
    documentType: string;
    uploadDate: string;
    status: string;
  }[];
  activeGoals: {
    id: string;
    goalName: string;
    domain: string;
    progressPercentage: number;
    status: string;
  }[];
}

export type LetterType = 'request' | 'concern' | 'thank_you' | 'follow_up' | 'complaint' | 'appeal';
export type LetterStatus = 'draft' | 'final' | 'sent';

export interface Letter {
  id: string;
  childId: string;
  letterType: LetterType;
  title: string;
  content: string;
  status: LetterStatus;
  recipientName?: string;
  recipientRole?: string;
  sentDate?: string;
  sentTo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLetterDto {
  childId: string;
  letterType: LetterType;
  title: string;
  content: string;
  recipientName?: string;
  recipientRole?: string;
}

export interface CounselorService {
  id: string;
  counselorId: string;
  counselorName: string;
  name: string;
  description: string;
  durationMinutes: number;
  price: number;
  specializations: string[];
}

export interface CounselorSlot {
  id: string;
  startTime: string;
  endTime: string;
  available: boolean;
}

export interface Appointment {
  id: string;
  serviceId: string;
  serviceName: string;
  counselorName: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'REQUESTED' | 'ACCEPTED' | 'WAITLISTED' | 'COMPLETED' | 'CANCELLED';
  paymentStatus: 'NOT_REQUIRED' | 'PENDING' | 'PAID';
  notes?: string;
  meetingLink?: string;
  createdAt: string;
}

export interface ConsultationSlot {
  id: string;
  expertName: string;
  expertTitle: string;
  date: string;
  startTime: string;
  endTime: string;
  available: boolean;
  concernAreas: string[];
}

export interface Consultation {
  id: string;
  expertName: string;
  date: string;
  startTime: string;
  endTime: string;
  concernArea: string;
  notes?: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  meetingLink?: string;
  createdAt: string;
}

export interface Plan {
  id: string;
  name: string;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  features: string[];
  isPopular?: boolean;
  maxChildren?: number;
  aiCredits?: number;
}

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  role: string;
  status: string;
  subscriptionPlan?: string;
  createdAt: string;
}
