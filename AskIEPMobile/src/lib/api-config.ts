const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;
if (!API_BASE_URL) {
  throw new Error('EXPO_PUBLIC_API_BASE_URL is not set. Add it to your .env file.')
}

export const API = {
  BASE_URL: API_BASE_URL,
  consent: `${API_BASE_URL}/consent`,
  children: `${API_BASE_URL}/children`,
  child: (id: string) => `${API_BASE_URL}/children/${id}`,
  dashboard: `${API_BASE_URL}/dashboard`,
  dashboardSummary: `${API_BASE_URL}/dashboard/summary`,
  dashboardOverview: (childId: string) =>
    `${API_BASE_URL}/dashboard/overview?childId=${childId}`,
  exchangeToken: `${API_BASE_URL}/api/v1/auth/exchange-token`,
  refreshToken: `${API_BASE_URL}/api/v1/auth/refresh-token`,
  logout: `${API_BASE_URL}/api/v1/auth/logout`,
  // IEP Documents
  iepUpload: `${API_BASE_URL}/api/v1/iep/upload`,
  iepList: `${API_BASE_URL}/api/v1/iep`,
  iep: (id: string) => `${API_BASE_URL}/api/v1/iep/${id}`,
  iepAnalyze: (id: string) => `${API_BASE_URL}/api/v1/iep/${id}/analyze-iep`,
  iepExtraction: (id: string) => `${API_BASE_URL}/api/v1/iep/${id}/extraction`,
  iepCorrections: (id: string) => `${API_BASE_URL}/api/v1/iep/${id}/corrections`,
  iepFinalize: (id: string) => `${API_BASE_URL}/api/v1/iep/${id}/finalize`,
  // Goals & Services
  goals: (childId: string) => `${API_BASE_URL}/api/v1/goals?childId=${childId}`,
  goalsCreate: `${API_BASE_URL}/api/v1/goals`,
  goal: (id: string) => `${API_BASE_URL}/api/v1/goals/${id}`,
  goalProgress: (id: string) => `${API_BASE_URL}/api/v1/goals/${id}/progress`,
  // Compliance
  services: (childId: string) => `${API_BASE_URL}/api/v1/services?childId=${childId}`,
  servicesCreate: `${API_BASE_URL}/api/v1/services`,
  service: (id: string) => `${API_BASE_URL}/api/v1/services/${id}`,
  // Behavior
  behaviors: (childId: string) => `${API_BASE_URL}/api/v1/behaviors?childId=${childId}`,
  behavior: (id: string) => `${API_BASE_URL}/api/v1/behaviors/${id}`,
  // Communications
  communications: (childId: string) => `${API_BASE_URL}/api/v1/communications?childId=${childId}`,
  communication: (id: string) => `${API_BASE_URL}/api/v1/communications/${id}`,
  // AI Chat
  advocacyChat: `${API_BASE_URL}/api/v1/advocacy/chat`,
  legalChat: `${API_BASE_URL}/api/v1/legal/chat`,
  // Contacts
  contacts: (childId: string) => `${API_BASE_URL}/api/v1/contacts?childId=${childId}`,
  contact: (id: string) => `${API_BASE_URL}/api/v1/contacts/${id}`,
  // Resources
  resources: `${API_BASE_URL}/api/v1/resources`,
  // Letters
  letters: `${API_BASE_URL}/api/v1/letters`,
  letter: (id: string) => `${API_BASE_URL}/api/v1/letters/${id}`,
  letterGenerate: `${API_BASE_URL}/api/v1/letters/generate`,
  // Counselor
  counselorCatalog: `${API_BASE_URL}/api/v1/counselors/catalog`,
  counselorSlots: (counselorId: string, serviceId: string) =>
    `${API_BASE_URL}/api/v1/counselors/${counselorId}/slots?serviceId=${serviceId}`,
  counselorCreateAppointment: `${API_BASE_URL}/api/v1/counselor/appointments`,
  counselorAppointments: `${API_BASE_URL}/api/v1/counselor/appointments/mine`,
  counselorAppointment: (id: string) => `${API_BASE_URL}/api/v1/counselor/appointments/mine/${id}`,
  // Consultation
  consultationSlots: `${API_BASE_URL}/api/v1/consultations/slots`,
  consultationBook: `${API_BASE_URL}/api/v1/consultations/book`,
  consultations: `${API_BASE_URL}/api/v1/consultations/mine`,
  consultationCancel: (id: string) => `${API_BASE_URL}/api/v1/consultations/mine/${id}/cancel`,
  // Billing
  plans: `${API_BASE_URL}/api/v1/plans`,
  subscribe: `${API_BASE_URL}/api/v1/billing/subscribe`,
  // Profile
  profile: `${API_BASE_URL}/api/v1/auth/profile`,
  changePassword: `${API_BASE_URL}/api/v1/auth/change-password`,
} as const;
