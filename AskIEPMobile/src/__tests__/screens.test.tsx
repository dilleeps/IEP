/**
 * Comprehensive screen tests for AskIEP Mobile.
 * Tests rendering, key UI elements, loading states, error states, and empty states
 * for all 17 screens.
 */
import { render, screen } from '@testing-library/react-native';
import React from 'react';

// ── Mock hooks ──────────────────────────────────────────────────────────────

const mockUseAuth = jest.fn(() => ({
  user: {
    id: 'user-1',
    email: 'parent@test.com',
    displayName: 'Test Parent',
    role: 'parent',
    status: 'active',
    provider: 'google',
    isApproved: true,
    isActive: true,
    subscriptionPlan: 'Pro',
  },
  isLoading: false,
  isAuthenticated: true,
  isNewUser: false,
  signInWithGoogle: jest.fn(),
  signInWithApple: jest.fn(),
  signOut: jest.fn(),
  getAccessToken: jest.fn(),
  handleMobileAuthCallback: jest.fn(),
}));

jest.mock('../providers/AuthProvider', () => ({
  useAuth: () => mockUseAuth(),
}));

// Children hook
const mockUseChildren = jest.fn(() => ({
  data: {children: [{id: 'child-1', name: 'Alex', grade: '3rd', schoolName: 'Lincoln Elementary', disabilities: ['ADHD']}]},
  isLoading: false,
  error: null,
  refetch: jest.fn(),
}));
const mockUseCreateChild = jest.fn(() => ({mutateAsync: jest.fn(), isPending: false}));
const mockUseDeleteChild = jest.fn(() => ({mutateAsync: jest.fn(), isPending: false}));

jest.mock('../hooks/useChildren', () => ({
  useChildren: () => mockUseChildren(),
  useCreateChild: () => mockUseCreateChild(),
  useDeleteChild: () => mockUseDeleteChild(),
}));

// Dashboard hooks
const mockUseDashboardSummary = jest.fn(() => ({
  data: {
    statistics: {goalsInProgress: 5, pendingFollowUps: 2, recentContactsCount: 3},
    recentActivity: [{id: 'a1', title: 'Goal Updated', date: '2026-01-01'}],
    upcomingDeadlines: [{id: 'd1', title: 'IEP Review', date: '2026-04-01', daysUntil: 15}],
  },
  isLoading: false,
  error: null,
  refetch: jest.fn(),
}));
const mockUseChildOverview = jest.fn(() => ({
  data: {
    data: {
      goalMastery: {averageProgress: 65, masteredGoals: 2, progressingGoals: 3},
      complianceHealth: {serviceDeliveryPercentage: 88, totalMissedSessions: 1},
    },
  },
}));

jest.mock('../hooks/useDashboard', () => ({
  useDashboardSummary: () => mockUseDashboardSummary(),
  useChildOverview: () => mockUseChildOverview(),
}));

// Goals hooks
const mockUseGoals = jest.fn(() => ({
  data: {goals: [{id: 'g1', goalName: 'Reading Comprehension', domain: 'Academic', progressPercentage: 70, description: 'Improve reading', baseline: 40, target: 90, metric: '% accuracy'}]},
  isLoading: false,
  error: null,
  refetch: jest.fn(),
}));
const mockUseCreateGoal = jest.fn(() => ({mutateAsync: jest.fn(), isPending: false}));
const mockUseUpdateGoal = jest.fn(() => ({mutateAsync: jest.fn(), isPending: false}));

jest.mock('../hooks/useGoals', () => ({
  useGoals: () => mockUseGoals(),
  useCreateGoal: () => mockUseCreateGoal(),
  useUpdateGoal: () => mockUseUpdateGoal(),
}));

// Behaviors hooks
const mockUseBehaviors = jest.fn(() => ({
  data: {behaviors: [{id: 'b1', date: '2026-01-15', antecedent: 'Transition to math', behavior: 'Left seat', consequence: 'Redirected'}]},
  isLoading: false,
  error: null,
  refetch: jest.fn(),
}));
const mockUseCreateBehavior = jest.fn(() => ({mutateAsync: jest.fn(), isPending: false}));

jest.mock('../hooks/useBehaviors', () => ({
  useBehaviors: () => mockUseBehaviors(),
  useCreateBehavior: () => mockUseCreateBehavior(),
}));

// Compliance hooks
const mockUseServices = jest.fn(() => ({
  data: {services: [{id: 's1', name: 'Speech Therapy', frequency: '2x weekly', met: 15, missed: 2, upcoming: 3}]},
  isLoading: false,
  error: null,
  refetch: jest.fn(),
}));
const mockUseCreateService = jest.fn(() => ({mutateAsync: jest.fn(), isPending: false}));

jest.mock('../hooks/useCompliance', () => ({
  useServices: () => mockUseServices(),
  useCreateService: () => mockUseCreateService(),
}));

// Communications hooks
const mockUseCommunications = jest.fn(() => ({
  data: {communications: [{id: 'c1', subject: 'IEP Meeting Follow-up', type: 'email', date: '2026-01-10', followUpDate: '2026-02-01'}]},
  isLoading: false,
  error: null,
  refetch: jest.fn(),
}));
const mockUseCreateCommunication = jest.fn(() => ({mutateAsync: jest.fn(), isPending: false}));

jest.mock('../hooks/useCommunications', () => ({
  useCommunications: () => mockUseCommunications(),
  useCreateCommunication: () => mockUseCreateCommunication(),
}));

// Documents hooks
const mockUseIEPDocuments = jest.fn(() => ({
  data: {documents: [{id: 'doc1', fileName: 'IEP_2026.pdf', status: 'analyzed', uploadDate: '2026-01-05'}]},
  isLoading: false,
  error: null,
  refetch: jest.fn(),
}));

jest.mock('../hooks/useDocuments', () => ({
  useIEPDocuments: () => mockUseIEPDocuments(),
}));

// Letters hooks
const mockUseLetters = jest.fn(() => ({
  data: {letters: [{id: 'l1', title: 'IEP Meeting Request', content: 'Dear Principal...', letterType: 'request', status: 'draft', recipientName: 'Dr. Smith', createdAt: '2026-01-08'}]},
  isLoading: false,
  error: null,
  refetch: jest.fn(),
}));
const mockUseCreateLetter = jest.fn(() => ({mutateAsync: jest.fn(), isPending: false}));
const mockUseUpdateLetter = jest.fn(() => ({mutateAsync: jest.fn(), isPending: false}));
const mockUseDeleteLetter = jest.fn(() => ({mutate: jest.fn(), isPending: false}));
const mockUseGenerateLetterDraft = jest.fn(() => ({mutateAsync: jest.fn(), isPending: false}));

jest.mock('../hooks/useLetters', () => ({
  useLetters: () => mockUseLetters(),
  useCreateLetter: () => mockUseCreateLetter(),
  useUpdateLetter: () => mockUseUpdateLetter(),
  useDeleteLetter: () => mockUseDeleteLetter(),
  useGenerateLetterDraft: () => mockUseGenerateLetterDraft(),
}));

// Counselor hooks
const mockUseCounselorCatalog = jest.fn(() => ({
  data: {services: [{id: 'cs1', name: 'IEP Review Session', counselorName: 'Dr. Jones', counselorId: 'coun1', durationMinutes: 60, price: 150, description: 'Full IEP review', specializations: ['IEP', 'Advocacy']}]},
  isLoading: false,
  error: null,
  refetch: jest.fn(),
}));
const mockUseCounselorSlots = jest.fn(() => ({
  data: {slots: [{id: 'slot1', startTime: '2026-02-01T10:00:00Z', available: true}]},
  isLoading: false,
  error: null,
  refetch: jest.fn(),
}));
const mockUseMyAppointments = jest.fn(() => ({
  data: {appointments: []},
  isLoading: false,
  error: null,
  refetch: jest.fn(),
}));
const mockUseCreateAppointment = jest.fn(() => ({mutateAsync: jest.fn(), isPending: false}));
const mockUseCancelAppointment = jest.fn(() => ({mutate: jest.fn(), isPending: false}));

jest.mock('../hooks/useCounselors', () => ({
  useCounselorCatalog: () => mockUseCounselorCatalog(),
  useCounselorSlots: () => mockUseCounselorSlots(),
  useMyAppointments: () => mockUseMyAppointments(),
  useCreateAppointment: () => mockUseCreateAppointment(),
  useCancelAppointment: () => mockUseCancelAppointment(),
}));

// Consultation hooks
const mockUseConsultationSlots = jest.fn(() => ({
  data: {slots: [{id: 'es1', expertName: 'Dr. Williams', expertTitle: 'IEP Specialist', date: '2026-02-05', startTime: '2026-02-05T14:00:00Z', available: true}]},
  isLoading: false,
  error: null,
  refetch: jest.fn(),
}));
const mockUseMyConsultations = jest.fn(() => ({
  data: {consultations: []},
  isLoading: false,
  error: null,
  refetch: jest.fn(),
}));
const mockUseBookConsultation = jest.fn(() => ({mutateAsync: jest.fn(), isPending: false}));
const mockUseCancelConsultation = jest.fn(() => ({mutate: jest.fn(), isPending: false}));

jest.mock('../hooks/useConsultations', () => ({
  useConsultationSlots: () => mockUseConsultationSlots(),
  useMyConsultations: () => mockUseMyConsultations(),
  useBookConsultation: () => mockUseBookConsultation(),
  useCancelConsultation: () => mockUseCancelConsultation(),
}));

// Resources hooks
const mockUseResources = jest.fn(() => ({
  data: {resources: [{id: 'r1', title: 'Understanding IDEA', description: 'Guide to IDEA rights', category: 'IEP Rights', url: 'https://example.com', isBookmarked: false}]},
  isLoading: false,
  error: null,
  refetch: jest.fn(),
}));
const mockUseBookmarkedResources = jest.fn(() => ({data: {resources: []}}));
const mockUseToggleBookmark = jest.fn(() => ({mutate: jest.fn()}));

jest.mock('../hooks/useResources', () => ({
  useResources: () => mockUseResources(),
  useBookmarkedResources: () => mockUseBookmarkedResources(),
  useToggleBookmark: () => mockUseToggleBookmark(),
}));

// Billing hooks
const mockUsePlans = jest.fn(() => ({
  data: {plans: [{id: 'p1', name: 'Pro', description: 'Full access', priceMonthly: 19.99, priceYearly: 191.99, features: ['AI Chat', 'Document Analysis', 'Letter Writer'], isPopular: true}]},
  isLoading: false,
  error: null,
  refetch: jest.fn(),
}));
const mockUseSubscribe = jest.fn(() => ({mutateAsync: jest.fn(), isPending: false}));

jest.mock('../hooks/useBilling', () => ({
  usePlans: () => mockUsePlans(),
  useSubscribe: () => mockUseSubscribe(),
}));

// Mock @tanstack/react-query
jest.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({invalidateQueries: jest.fn()}),
}));

// ── Screen imports ──────────────────────────────────────────────────────────

import DashboardScreen from '../screens/DashboardScreen';
import SignInScreen from '../screens/SignInScreen';
import AIChatScreen from '../screens/AIChatScreen';
import CounselorBookingScreen from '../screens/CounselorBookingScreen';
import DocumentsScreen from '../screens/DocumentsScreen';
import LetterWriterScreen from '../screens/LetterWriterScreen';
import TrackingScreen from '../screens/TrackingScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ResourcesScreen from '../screens/ResourcesScreen';
import BehaviorEditScreen from '../screens/BehaviorEditScreen';
import ChildrenScreen from '../screens/ChildrenScreen';
import ComplianceEditScreen from '../screens/ComplianceEditScreen';
import { ConsentOverlay } from '../screens/ConsentScreen';
import ContactEditScreen from '../screens/ContactEditScreen';
import GoalEditScreen from '../screens/GoalEditScreen';
import ExpertConsultationScreen from '../screens/ExpertConsultationScreen';
import SubscriptionScreen from '../screens/SubscriptionScreen';

// ═══════════════════════════════════════════════════════════════════════════
// 1. DashboardScreen
// ═══════════════════════════════════════════════════════════════════════════
describe('DashboardScreen', () => {
  it('renders hero section with welcome message', () => {
    render(<DashboardScreen />);
    expect(screen.getByText('Welcome back')).toBeTruthy();
    expect(screen.getByText("Your child's IEP at a glance")).toBeTruthy();
  });

  it('renders stat cards with correct values', () => {
    render(<DashboardScreen />);
    expect(screen.getByText('5')).toBeTruthy();
    expect(screen.getByText('Active Goals')).toBeTruthy();
    expect(screen.getAllByText('2').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Follow-ups')).toBeTruthy();
    expect(screen.getAllByText('3').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Contacts')).toBeTruthy();
  });

  it('renders goal progress section', () => {
    render(<DashboardScreen />);
    expect(screen.getByText('Goal Progress')).toBeTruthy();
    expect(screen.getByText('65%')).toBeTruthy();
    expect(screen.getByText('Average')).toBeTruthy();
  });

  it('renders compliance section', () => {
    render(<DashboardScreen />);
    expect(screen.getByText('Compliance')).toBeTruthy();
    expect(screen.getByText('88%')).toBeTruthy();
    expect(screen.getByText('Service Delivery')).toBeTruthy();
    expect(screen.getByText('1 missed sessions')).toBeTruthy();
  });

  it('renders recent activity', () => {
    render(<DashboardScreen />);
    expect(screen.getByText('Recent Activity')).toBeTruthy();
    expect(screen.getByText('Goal Updated')).toBeTruthy();
  });

  it('renders upcoming deadlines', () => {
    render(<DashboardScreen />);
    expect(screen.getByText('Upcoming Deadlines')).toBeTruthy();
    expect(screen.getByText('IEP Review')).toBeTruthy();
    expect(screen.getByText('15d')).toBeTruthy();
  });

  it('shows loading state', () => {
    mockUseDashboardSummary.mockReturnValueOnce({
      data: null, isLoading: true, error: null, refetch: jest.fn(),
    });
    const {UNSAFE_getByType} = render(<DashboardScreen />);
    const {ActivityIndicator} = require('react-native');
    expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
  });

  it('shows error state', () => {
    mockUseDashboardSummary.mockReturnValueOnce({
      data: null, isLoading: false, error: new Error('Network error'), refetch: jest.fn(),
    });
    render(<DashboardScreen />);
    expect(screen.getByText('Network error')).toBeTruthy();
    expect(screen.getByText('Try Again')).toBeTruthy();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. SignInScreen
// ═══════════════════════════════════════════════════════════════════════════
describe('SignInScreen', () => {
  it('renders app branding', () => {
    render(<SignInScreen />);
    expect(screen.getByText('AskIEP')).toBeTruthy();
    expect(screen.getByText('AI-powered IEP support for parents')).toBeTruthy();
  });

  it('renders Google sign-in button', () => {
    render(<SignInScreen />);
    expect(screen.getByText('Continue with Google')).toBeTruthy();
  });

  it('renders disclaimer text', () => {
    render(<SignInScreen />);
    expect(screen.getByText(/Terms of Service and Privacy Policy/)).toBeTruthy();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. AIChatScreen
// ═══════════════════════════════════════════════════════════════════════════
describe('AIChatScreen', () => {
  it('renders title and mode selector', () => {
    render(<AIChatScreen />);
    expect(screen.getByText('AI Chat')).toBeTruthy();
    expect(screen.getByText('Advocacy Lab')).toBeTruthy();
    expect(screen.getByText('Legal Support')).toBeTruthy();
  });

  it('renders empty state for advocacy mode', () => {
    render(<AIChatScreen />);
    expect(screen.getByText(/Ask questions about IEP advocacy strategies/)).toBeTruthy();
  });

  it('renders input field and send button', () => {
    render(<AIChatScreen />);
    expect(screen.getByLabelText('Message input')).toBeTruthy();
    expect(screen.getByLabelText('Send message')).toBeTruthy();
  });

  it('renders AI disclaimer', () => {
    render(<AIChatScreen />);
    expect(screen.getByText(/AI responses are for informational purposes only/)).toBeTruthy();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 4. CounselorBookingScreen
// ═══════════════════════════════════════════════════════════════════════════
describe('CounselorBookingScreen', () => {
  it('renders browse catalog view', () => {
    render(<CounselorBookingScreen />);
    expect(screen.getByText('Counselors')).toBeTruthy();
    expect(screen.getByText('My Appts')).toBeTruthy();
  });

  it('renders counselor service cards', () => {
    render(<CounselorBookingScreen />);
    expect(screen.getByText('IEP Review Session')).toBeTruthy();
    expect(screen.getByText(/Dr. Jones/)).toBeTruthy();
    expect(screen.getByText(/60 min/)).toBeTruthy();
  });

  it('renders specialization tags', () => {
    render(<CounselorBookingScreen />);
    expect(screen.getByText('IEP')).toBeTruthy();
    expect(screen.getByText('Advocacy')).toBeTruthy();
  });

  it('shows loading state', () => {
    mockUseCounselorCatalog.mockReturnValueOnce({
      data: null, isLoading: true, error: null, refetch: jest.fn(),
    });
    const {UNSAFE_getByType} = render(<CounselorBookingScreen />);
    const {ActivityIndicator} = require('react-native');
    expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
  });

  it('shows empty catalog state', () => {
    mockUseCounselorCatalog.mockReturnValueOnce({
      data: {services: []}, isLoading: false, error: null, refetch: jest.fn(),
    });
    render(<CounselorBookingScreen />);
    expect(screen.getByText('No counselor services available')).toBeTruthy();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 5. DocumentsScreen
// ═══════════════════════════════════════════════════════════════════════════
describe('DocumentsScreen', () => {
  it('renders title', () => {
    render(<DocumentsScreen />);
    expect(screen.getByText('IEP Documents')).toBeTruthy();
  });

  it('renders document cards', () => {
    render(<DocumentsScreen />);
    expect(screen.getByText('IEP_2026.pdf')).toBeTruthy();
    expect(screen.getByText('analyzed')).toBeTruthy();
  });

  it('renders upload FAB', () => {
    render(<DocumentsScreen />);
    expect(screen.getByLabelText('Upload IEP document')).toBeTruthy();
  });

  it('shows empty state when no documents', () => {
    mockUseIEPDocuments.mockReturnValueOnce({
      data: {documents: []}, isLoading: false, error: null, refetch: jest.fn(),
    });
    render(<DocumentsScreen />);
    expect(screen.getByText('No documents yet')).toBeTruthy();
    expect(screen.getByText(/Upload your child's IEP document/)).toBeTruthy();
  });

  it('shows loading state', () => {
    mockUseIEPDocuments.mockReturnValueOnce({
      data: null, isLoading: true, error: null, refetch: jest.fn(),
    });
    const {UNSAFE_getByType} = render(<DocumentsScreen />);
    const {ActivityIndicator} = require('react-native');
    expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
  });

  it('shows error state', () => {
    mockUseIEPDocuments.mockReturnValueOnce({
      data: null, isLoading: false, error: new Error('Failed to load'), refetch: jest.fn(),
    });
    render(<DocumentsScreen />);
    expect(screen.getByText('Failed to load')).toBeTruthy();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 6. LetterWriterScreen
// ═══════════════════════════════════════════════════════════════════════════
describe('LetterWriterScreen', () => {
  it('renders list view with title', () => {
    render(<LetterWriterScreen />);
    expect(screen.getByText('Letter Writer')).toBeTruthy();
    expect(screen.getByText('New Letter')).toBeTruthy();
  });

  it('renders letter cards', () => {
    render(<LetterWriterScreen />);
    expect(screen.getByText('IEP Meeting Request')).toBeTruthy();
    expect(screen.getByText('draft')).toBeTruthy();
    expect(screen.getByText('To: Dr. Smith')).toBeTruthy();
  });

  it('shows empty state', () => {
    mockUseLetters.mockReturnValueOnce({
      data: {letters: []}, isLoading: false, error: null, refetch: jest.fn(),
    });
    render(<LetterWriterScreen />);
    expect(screen.getByText('No letters yet')).toBeTruthy();
    expect(screen.getByText(/Use AI to draft letters/)).toBeTruthy();
  });

  it('shows loading state', () => {
    mockUseLetters.mockReturnValueOnce({
      data: null, isLoading: true, error: null, refetch: jest.fn(),
    });
    const {UNSAFE_getByType} = render(<LetterWriterScreen />);
    const {ActivityIndicator} = require('react-native');
    expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 7. TrackingScreen
// ═══════════════════════════════════════════════════════════════════════════
describe('TrackingScreen', () => {
  it('renders title and tab buttons', () => {
    render(<TrackingScreen />);
    expect(screen.getByText('Tracking')).toBeTruthy();
    expect(screen.getByText('Goals')).toBeTruthy();
    expect(screen.getByText('Behavior')).toBeTruthy();
    expect(screen.getByText('Services')).toBeTruthy();
    expect(screen.getByText('Comms')).toBeTruthy();
  });

  it('renders goals tab content by default', () => {
    render(<TrackingScreen />);
    expect(screen.getByText('Reading Comprehension')).toBeTruthy();
    expect(screen.getByText('70% complete')).toBeTruthy();
    expect(screen.getByText('Academic')).toBeTruthy();
  });

  it('renders FAB for adding items', () => {
    render(<TrackingScreen />);
    expect(screen.getByLabelText('Add new goal')).toBeTruthy();
  });

  it('shows empty goals state', () => {
    mockUseGoals.mockReturnValueOnce({
      data: {goals: []}, isLoading: false, error: null, refetch: jest.fn(),
    });
    render(<TrackingScreen />);
    expect(screen.getByText('No goals tracked yet')).toBeTruthy();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 8. SettingsScreen
// ═══════════════════════════════════════════════════════════════════════════
describe('SettingsScreen', () => {
  it('renders title', () => {
    render(<SettingsScreen />);
    expect(screen.getByText('Settings')).toBeTruthy();
  });

  it('renders user profile', () => {
    render(<SettingsScreen />);
    expect(screen.getByText('parent@test.com')).toBeTruthy();
    expect(screen.getByText('parent')).toBeTruthy();
    expect(screen.getByText('Pro Plan')).toBeTruthy();
  });

  it('renders feature navigation', () => {
    render(<SettingsScreen />);
    expect(screen.getByText('Expert Consultation')).toBeTruthy();
    expect(screen.getByText('Subscription & Plans')).toBeTruthy();
    expect(screen.getByText('Educational Resources')).toBeTruthy();
  });

  it('renders security section', () => {
    render(<SettingsScreen />);
    expect(screen.getByText('Security')).toBeTruthy();
    expect(screen.getByText('Face ID / Touch ID')).toBeTruthy();
  });

  it('renders notifications section', () => {
    render(<SettingsScreen />);
    expect(screen.getByText('Notifications')).toBeTruthy();
    expect(screen.getByText('Push notifications')).toBeTruthy();
    expect(screen.getByText('Email notifications')).toBeTruthy();
  });

  it('renders about section', () => {
    render(<SettingsScreen />);
    expect(screen.getByText('About')).toBeTruthy();
    expect(screen.getByText('Version')).toBeTruthy();
    expect(screen.getByText('1.0.0-test')).toBeTruthy();
    expect(screen.getByText('Privacy Policy')).toBeTruthy();
    expect(screen.getByText('Terms of Service')).toBeTruthy();
    expect(screen.getByText('Contact Support')).toBeTruthy();
  });

  it('renders sign out button', () => {
    render(<SettingsScreen />);
    expect(screen.getByLabelText('Sign out of your account')).toBeTruthy();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 9. ResourcesScreen
// ═══════════════════════════════════════════════════════════════════════════
describe('ResourcesScreen', () => {
  it('renders title and subtitle', () => {
    render(<ResourcesScreen />);
    expect(screen.getByText('Resources')).toBeTruthy();
    expect(screen.getByText('Educational materials about IEP rights and processes')).toBeTruthy();
  });

  it('renders filter categories', () => {
    render(<ResourcesScreen />);
    expect(screen.getByText('All')).toBeTruthy();
    expect(screen.getAllByText('IEP Rights').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Legal').length).toBeGreaterThanOrEqual(1);
  });

  it('renders resource cards', () => {
    render(<ResourcesScreen />);
    expect(screen.getByText('Understanding IDEA')).toBeTruthy();
    expect(screen.getByText('Guide to IDEA rights')).toBeTruthy();
  });

  it('shows empty state when no resources', () => {
    mockUseResources.mockReturnValueOnce({
      data: {resources: []}, isLoading: false, error: null, refetch: jest.fn(),
    });
    render(<ResourcesScreen />);
    expect(screen.getByText('No resources found')).toBeTruthy();
  });

  it('shows error state', () => {
    mockUseResources.mockReturnValueOnce({
      data: null, isLoading: false, error: new Error('Server error'), refetch: jest.fn(),
    });
    render(<ResourcesScreen />);
    expect(screen.getByText('Failed to load resources')).toBeTruthy();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 10. BehaviorEditScreen
// ═══════════════════════════════════════════════════════════════════════════
describe('BehaviorEditScreen', () => {
  it('renders title and ABC model info', () => {
    render(<BehaviorEditScreen />);
    expect(screen.getByText('Log Behavior')).toBeTruthy();
    expect(screen.getByText(/Use the ABC model/)).toBeTruthy();
  });

  it('renders all form fields', () => {
    render(<BehaviorEditScreen />);
    expect(screen.getByLabelText('Date')).toBeTruthy();
    expect(screen.getByLabelText('Antecedent - what happened before the behavior')).toBeTruthy();
    expect(screen.getByLabelText('The behavior observed')).toBeTruthy();
    expect(screen.getByLabelText('Consequence - what happened after the behavior')).toBeTruthy();
    expect(screen.getByLabelText('Additional notes')).toBeTruthy();
  });

  it('renders action buttons', () => {
    render(<BehaviorEditScreen />);
    expect(screen.getByLabelText('Cancel')).toBeTruthy();
    expect(screen.getByLabelText('Save behavior entry')).toBeTruthy();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 11. ChildrenScreen
// ═══════════════════════════════════════════════════════════════════════════
describe('ChildrenScreen', () => {
  it('renders title', () => {
    render(<ChildrenScreen />);
    expect(screen.getByText('Children')).toBeTruthy();
  });

  it('renders child cards', () => {
    render(<ChildrenScreen />);
    expect(screen.getByText('Alex')).toBeTruthy();
    expect(screen.getByText(/3rd/)).toBeTruthy();
    expect(screen.getByText('ADHD')).toBeTruthy();
  });

  it('renders FAB for adding children', () => {
    render(<ChildrenScreen />);
    expect(screen.getByLabelText('Add child')).toBeTruthy();
  });

  it('shows empty state', () => {
    mockUseChildren.mockReturnValueOnce({
      data: {children: []}, isLoading: false, error: null, refetch: jest.fn(),
    });
    render(<ChildrenScreen />);
    expect(screen.getByText('No children added yet')).toBeTruthy();
    expect(screen.getByText(/Add your first child/)).toBeTruthy();
  });

  it('shows loading state', () => {
    mockUseChildren.mockReturnValueOnce({
      data: null, isLoading: true, error: null, refetch: jest.fn(),
    });
    const {UNSAFE_getByType} = render(<ChildrenScreen />);
    const {ActivityIndicator} = require('react-native');
    expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
  });

  it('shows error state', () => {
    mockUseChildren.mockReturnValueOnce({
      data: null, isLoading: false, error: new Error('Load failed'), refetch: jest.fn(),
    });
    render(<ChildrenScreen />);
    expect(screen.getByText('Load failed')).toBeTruthy();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 12. ComplianceEditScreen
// ═══════════════════════════════════════════════════════════════════════════
describe('ComplianceEditScreen', () => {
  it('renders title', () => {
    render(<ComplianceEditScreen />);
    expect(screen.getByText('Log Service')).toBeTruthy();
  });

  it('renders all form fields', () => {
    render(<ComplianceEditScreen />);
    expect(screen.getByLabelText('Service type')).toBeTruthy();
    expect(screen.getByLabelText('Service provider name')).toBeTruthy();
    expect(screen.getByLabelText('Service date')).toBeTruthy();
    expect(screen.getByLabelText('Minutes provided')).toBeTruthy();
    expect(screen.getByLabelText('Minutes required')).toBeTruthy();
    expect(screen.getByLabelText('Notes')).toBeTruthy();
  });

  it('renders status segmented buttons', () => {
    render(<ComplianceEditScreen />);
    expect(screen.getByText('Provided')).toBeTruthy();
    expect(screen.getByText('Scheduled')).toBeTruthy();
    expect(screen.getByText('Missed')).toBeTruthy();
  });

  it('renders action buttons', () => {
    render(<ComplianceEditScreen />);
    expect(screen.getByLabelText('Cancel')).toBeTruthy();
    expect(screen.getByLabelText('Save service entry')).toBeTruthy();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 13. ConsentScreen
// ═══════════════════════════════════════════════════════════════════════════
describe('ConsentScreen', () => {
  const mockAccepted = jest.fn();
  const mockDeclined = jest.fn();

  it('renders title and subtitle', () => {
    render(<ConsentOverlay onAccepted={mockAccepted} onDeclined={mockDeclined} />);
    expect(screen.getByText('Parent Consent Agreement')).toBeTruthy();
    expect(screen.getByText('Please review and accept to continue')).toBeTruthy();
  });

  it('renders consent text', () => {
    render(<ConsentOverlay onAccepted={mockAccepted} onDeclined={mockDeclined} />);
    expect(screen.getByText(/DATA COLLECTION/)).toBeTruthy();
    expect(screen.getByText(/FERPA and COPPA/)).toBeTruthy();
  });

  it('renders accept and decline buttons', () => {
    render(<ConsentOverlay onAccepted={mockAccepted} onDeclined={mockDeclined} />);
    expect(screen.getByLabelText('Accept consent agreement')).toBeTruthy();
    expect(screen.getByLabelText('Decline consent agreement')).toBeTruthy();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 14. ContactEditScreen
// ═══════════════════════════════════════════════════════════════════════════
describe('ContactEditScreen', () => {
  it('renders title', () => {
    render(<ContactEditScreen />);
    expect(screen.getByText('Log Communication')).toBeTruthy();
  });

  it('renders type selector', () => {
    render(<ContactEditScreen />);
    expect(screen.getByText('Email')).toBeTruthy();
    expect(screen.getByText('Phone')).toBeTruthy();
    expect(screen.getByText('Meeting')).toBeTruthy();
    expect(screen.getByText('Letter')).toBeTruthy();
  });

  it('renders all form fields', () => {
    render(<ContactEditScreen />);
    expect(screen.getByLabelText('Communication date')).toBeTruthy();
    expect(screen.getByLabelText('Contact person name')).toBeTruthy();
    expect(screen.getByLabelText('Subject')).toBeTruthy();
    expect(screen.getByLabelText('Communication notes')).toBeTruthy();
    expect(screen.getByLabelText('Follow-up date')).toBeTruthy();
  });

  it('renders action buttons', () => {
    render(<ContactEditScreen />);
    expect(screen.getByLabelText('Cancel')).toBeTruthy();
    expect(screen.getByLabelText('Save communication')).toBeTruthy();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 15. GoalEditScreen
// ═══════════════════════════════════════════════════════════════════════════
describe('GoalEditScreen', () => {
  it('renders title for new goal', () => {
    render(<GoalEditScreen />);
    expect(screen.getByText('New Goal')).toBeTruthy();
  });

  it('renders all form fields', () => {
    render(<GoalEditScreen />);
    expect(screen.getByLabelText('Goal name')).toBeTruthy();
    expect(screen.getByLabelText('Goal description')).toBeTruthy();
    expect(screen.getByLabelText('Baseline value')).toBeTruthy();
    expect(screen.getByLabelText('Target value')).toBeTruthy();
    expect(screen.getByLabelText('Measurement metric')).toBeTruthy();
    expect(screen.getByLabelText('Start date')).toBeTruthy();
    expect(screen.getByLabelText('Target date')).toBeTruthy();
  });

  it('renders domain selection buttons', () => {
    render(<GoalEditScreen />);
    expect(screen.getByText('Academic')).toBeTruthy();
    expect(screen.getByText('Communication')).toBeTruthy();
    expect(screen.getByText('Social/Emotional')).toBeTruthy();
    expect(screen.getByText('Motor Skills')).toBeTruthy();
    expect(screen.getByText('Self-Help')).toBeTruthy();
    expect(screen.getByText('Behavior')).toBeTruthy();
    expect(screen.getByText('Transition')).toBeTruthy();
    expect(screen.getByText('Other')).toBeTruthy();
  });

  it('renders action buttons', () => {
    render(<GoalEditScreen />);
    expect(screen.getByLabelText('Cancel')).toBeTruthy();
    expect(screen.getByLabelText('Save goal')).toBeTruthy();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 16. ExpertConsultationScreen
// ═══════════════════════════════════════════════════════════════════════════
describe('ExpertConsultationScreen', () => {
  it('renders title', () => {
    render(<ExpertConsultationScreen />);
    expect(screen.getByText('Expert Consultation')).toBeTruthy();
    expect(screen.getByText('My Consults')).toBeTruthy();
  });

  it('renders concern areas', () => {
    render(<ExpertConsultationScreen />);
    expect(screen.getByText('IEP Review')).toBeTruthy();
    expect(screen.getByText('Goal Setting')).toBeTruthy();
    expect(screen.getByText('Behavior Support')).toBeTruthy();
    expect(screen.getByText('Transition Planning')).toBeTruthy();
    expect(screen.getByText('Dispute Resolution')).toBeTruthy();
  });

  it('renders available expert slots', () => {
    render(<ExpertConsultationScreen />);
    expect(screen.getByText('Dr. Williams')).toBeTruthy();
    expect(screen.getByText('IEP Specialist')).toBeTruthy();
  });

  it('renders book button', () => {
    render(<ExpertConsultationScreen />);
    expect(screen.getByLabelText('Book consultation')).toBeTruthy();
  });

  it('shows empty slots state', () => {
    mockUseConsultationSlots.mockReturnValueOnce({
      data: {slots: []}, isLoading: false, error: null, refetch: jest.fn(),
    });
    render(<ExpertConsultationScreen />);
    expect(screen.getByText('No slots available right now')).toBeTruthy();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 17. SubscriptionScreen
// ═══════════════════════════════════════════════════════════════════════════
describe('SubscriptionScreen', () => {
  it('renders title', () => {
    render(<SubscriptionScreen />);
    expect(screen.getByText('Subscription Plans')).toBeTruthy();
  });

  it('renders current plan', () => {
    render(<SubscriptionScreen />);
    expect(screen.getByText('Current Plan')).toBeTruthy();
    expect(screen.getAllByText('Pro').length).toBeGreaterThanOrEqual(1);
  });

  it('renders billing interval toggle', () => {
    render(<SubscriptionScreen />);
    expect(screen.getByText('Monthly')).toBeTruthy();
    expect(screen.getByText('Yearly (Save 20%)')).toBeTruthy();
  });

  it('renders plan cards with features', () => {
    render(<SubscriptionScreen />);
    expect(screen.getByText('Most Popular')).toBeTruthy();
    expect(screen.getByText('Full access')).toBeTruthy();
    expect(screen.getByText('AI Chat')).toBeTruthy();
    expect(screen.getByText('Document Analysis')).toBeTruthy();
    expect(screen.getByText('Letter Writer')).toBeTruthy();
  });

  it('renders subscribe button', () => {
    render(<SubscriptionScreen />);
    expect(screen.getByLabelText('Subscribe to Pro')).toBeTruthy();
  });

  it('shows loading state', () => {
    mockUsePlans.mockReturnValueOnce({
      data: null, isLoading: true, error: null, refetch: jest.fn(),
    });
    const {UNSAFE_getByType} = render(<SubscriptionScreen />);
    const {ActivityIndicator} = require('react-native');
    expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
  });

  it('shows error state', () => {
    mockUsePlans.mockReturnValueOnce({
      data: null, isLoading: false, error: new Error('Plans unavailable'), refetch: jest.fn(),
    });
    render(<SubscriptionScreen />);
    expect(screen.getByText('Plans unavailable')).toBeTruthy();
  });
});
