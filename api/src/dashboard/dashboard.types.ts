// src/modules/dashboard/dashboard.types.ts

export interface DashboardSummaryResponse {
  children: {
    total: number;
    active: number;
  };
  upcomingDeadlines: Array<{
    id: string;
    childId: string;
    childName: string;
    type: 'iep_meeting' | 'evaluation' | 'goal_review' | 'follow_up';
    title: string;
    date: string;
    daysUntil: number;
  }>;
  advocacyAlerts: {
    total: number;
    byPriority: {
      high: number;
      medium: number;
      low: number;
    };
  };
  recentActivity: Array<{
    id: string;
    type: 'communication' | 'behavior' | 'goal_update' | 'compliance' | 'document';
    title: string;
    childName?: string;
    date: string;
  }>;
  advocacyQuote?: string;
  statistics: {
    totalGoals: number;
    goalsInProgress: number;
    totalCommunications: number;
    pendingFollowUps: number;
    recentContactsCount: number;
  };
}

export interface DashboardOverviewResponse {
  child: {
    id: string;
    name: string;
    grade?: string;
    school?: string;
    disabilities?: string[];
  };
  complianceHealth: {
    serviceDeliveryPercentage: number;
    totalMissedSessions: number;
    reviewStatus: 'on_track' | 'due_soon' | 'overdue';
  } | null;
  goalMastery: {
    masteredGoals: number;
    progressingGoals: number;
    emergingGoals: number;
    notStartedGoals: number;
    averageProgress: number;
  } | null;
  recentDocuments: Array<{
    id: string;
    fileName: string;
    documentType: string;
    uploadDate: string;
    status: string;
  }>;
  activeGoals: Array<{
    id: string;
    goalName: string;
    domain: string;
    progressPercentage: number;
    status: string;
  }>;
}
