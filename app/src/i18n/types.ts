export interface Translations {
  // Navigation
  nav: {
    dashboard: string;
    childProfile: string;
    iepAnalyzer: string;
    iepDocuments: string;
    goalProgress: string;
    contactLog: string;
    letterWriter: string;
    advocacyLab: string;
    compliance: string;
    legalSupport: string;
    resources: string;
    userManagement: string;
    settings: string;
    counselorDashboard: string;
    counselorAppointments: string;
    counselorAvailability: string;
    counselorServices: string;
    counselorProfile: string;
    counselorBooking: string;
    expertConsultation: string;
    adminAnalytics: string;
    adminPlans: string;
    billing: string;
    help: string;
  };

  // Common
  common: {
    loading: string;
    save: string;
    cancel: string;
    delete: string;
    edit: string;
    add: string;
    search: string;
    confirm: string;
    back: string;
    next: string;
    previous: string;
    first: string;
    last: string;
    enabled: string;
    disabled: string;
    showing: string;
    of: string;
    noResults: string;
    actionCannotBeUndone: string;
    success: string;
    error: string;
    copy: string;
    close: string;
    required: string;
    optional: string;
    yes: string;
    no: string;
  };

  // Topbar
  topbar: {
    notifications: string;
    clearAll: string;
    allCaughtUp: string;
    noNotifications: string;
    logout: string;
  };

  // Login Page
  login: {
    title: string;
    subtitle: string;
    email: string;
    emailPlaceholder: string;
    password: string;
    authenticate: string;
    authenticating: string;
    continueWithGoogle: string;
    connectingToGoogle: string;
    showPassword: string;
    hidePassword: string;
    devModeAccounts: string;
    noAccount: string;
    createAccount: string;
  };

  // Register Page
  register: {
    title: string;
    subtitle: string;
    fullName: string;
    fullNamePlaceholder: string;
    email: string;
    emailPlaceholder: string;
    iAmA: string;
    selectRole: string;
    parent: string;
    advocate: string;
    teacherTherapist: string;
    roleNote: string;
    password: string;
    confirmPassword: string;
    passwordMust: string;
    minLength: string;
    uppercase: string;
    lowercase: string;
    number: string;
    register: string;
    creatingAccount: string;
    agreeTerms: string;
    termsOfService: string;
    privacyPolicy: string;
    aiDisclaimer: string;
    alreadyHaveAccount: string;
    signIn: string;
    acceptTerms: string;
    passwordsDontMatch: string;
    passwordsDontMatchDesc: string;
    weakPassword: string;
  };

  // Dashboard
  dashboard: {
    welcomeBack: string;
    subtitle: string;
    advocacyHubActive: string;
    empowering: string;
    advocacy: string;
    heroDescription: string;
    analyzeNewIEP: string;
    advocacyLab: string;
    complianceHealth: string;
    delivery: string;
    serviceOptimal: string;
    serviceGapDetected: string;
    goalMastery: string;
    mastered: string;
    progressing: string;
    emerging: string;
    goals: string;
    viewProgressRoadmap: string;
    advocacyWisdom: string;
    dailyInsight: string;
    advocacyToolbox: string;
    goalTracker: string;
    goalTrackerDesc: string;
    logNewData: string;
    contactLog: string;
    contactLogDesc: string;
    secureLogEntry: string;
    letterWriter: string;
    letterWriterDesc: string;
    draftNewLetter: string;
    iepAnalyzer: string;
    iepAnalyzerDesc: string;
    startAnalysis: string;
    quickResources: string;
    ideaRightsGuide: string;
    draftingParentConcerns: string;
    recentIEPDocuments: string;
    latestUploadedDocs: string;
    viewAllDocuments: string;
    noDocumentsYet: string;
    uploadFirstDocument: string;
    complianceSnapshot: string;
    systemHealth: string;
    totalCommunications: string;
    pendingFollowUps: string;
    recentContacts: string;
  };

  // Child Profile
  childProfile: {
    title: string;
    subtitle: string;
    addChild: string;
    noChildren: string;
    noChildrenDesc: string;
    disabilities: string;
    accommodations: string;
    more: string;
    deleteTitle: string;
    deleteConfirm: string;
    deleteWarning: string;
    deleteGoals: string;
    deleteProgress: string;
    deleteBehavior: string;
    deleteContacts: string;
    deletePermanently: string;
    deleteSuccess: string;
    deleteFailed: string;
    age: string;
    grade: string;
  };

  // Goal Progress
  goalProgress: {
    title: string;
    subtitle: string;
    selectChild: string;
    addGoal: string;
    addChildFirst: string;
    addChildFirstDesc: string;
    noGoals: string;
    goal: string;
    progress: string;
    target: string;
    baseline: string;
    current: string;
    onTrack: string;
    needsAttention: string;
    atRisk: string;
    updateProgress: string;
    updateProgressDesc: string;
    updateSuccess: string;
    updateFailed: string;
    editGoal: string;
    deleteGoal: string;
    deleteGoalConfirm: string;
    deleteSuccess: string;
    deleteFailed: string;
    progressPercentage: string;
    enterProgress: string;
    preview: string;
    complete: string;
    howCalculatedTitle: string;
    howCalculatedDesc: string;
    uploadIep: string;
    percentNote: string;
    expected: string;
    behindExpected: string;
    aheadOfExpected: string;
    onTrackForDate: string;
  };

  // Contact Log
  contactLog: {
    title: string;
    subtitle: string;
    logContact: string;
    noContacts: string;
    noContactsDesc: string;
    showingContacts: string;
    deleteTitle: string;
    deleteConfirm: string;
    deleteSuccess: string;
    deleteFailed: string;
    loadFailed: string;
    email: string;
    phoneCall: string;
    meeting: string;
  };

  // Letter Writer
  letterWriter: {
    title: string;
    subtitle: string;
    newLetter: string;
    noLetters: string;
    noLettersDesc: string;
    createFirstLetter: string;
    untitledLetter: string;
    sent: string;
    draft: string;
    final: string;
    markAsSent: string;
    deleteTitle: string;
    deleteConfirm: string;
    copiedToClipboard: string;
    deleteSuccess: string;
    markedAsSent: string;
    loadFailed: string;
    deleteFailed: string;
    markSentFailed: string;
  };

  // IEP Analyzer
  iepAnalyzer: {
    title: string;
    subtitle: string;
    aiDisclaimer: string;
    duplicateTitle: string;
    duplicateDesc: string;
    duplicateQuestion: string;
    replaceUpload: string;
    uploading: string;
    loadChildrenFailed: string;
    uploadFailed: string;
    replaceFailed: string;
  };

  // Advocacy Lab
  advocacyLab: {
    aiDisclaimer: string;
    title: string;
    subtitle: string;
    selectChild: string;
    noChildContext: string;
    goal: string;
    thinking: string;
    welcomeMessage: string;
    initFailed: string;
    sendFailed: string;
  };

  // Legal Support
  legalSupport: {
    signInRequired: string;
    starting: string;
    title: string;
    subtitle: string;
    aiConsultant: string;
    disclaimer: string;
    signInToChat: string;
    processingError: string;
    messageFailed: string;
    startFailed: string;
    newChatFailed: string;
    createSessionFailed: string;
    resetSessionFailed: string;
    sendMessageFailed: string;
    thinking: string;
  };

  // Compliance
  compliance: {
    title: string;
    subtitle: string;
    logService: string;
    noLogs: string;
    noLogsDesc: string;
    servicesProvided: string;
    servicesMissed: string;
    needsMakeup: string;
    upcoming: string;
    scheduledSessions: string;
    complianceRate: string;
    provided: string;
    scheduled: string;
    missed: string;
    cancelled: string;
    issueReported: string;
    under: string;
    over: string;
    deleteTitle: string;
    deleteConfirm: string;
    deleteSuccess: string;
    deleteFailed: string;
    loadFailed: string;
    total: string;
    provider: string;
    resolution: string;
    minutesProvided: string;
    minutesRequired: string;
    scheduledFor: string;
  };

  // Resources
  resources: {
    title: string;
    subtitle: string;
    knowledgeBase: string;
    heroSubtitle: string;
    ideaRights: string;
    mustRead: string;
    meetingScripts: string;
    advocacy: string;
    webinarSeries: string;
    training: string;
    exploreGuide: string;
    advocacyOrgs: string;
    legalRights: string;
    educationalSupport: string;
    needLocalHelp: string;
    localHelpDesc: string;
    findStatePTI: string;
  };

  // Settings
  settings: {
    title: string;
    subtitle: string;
    profileInfo: string;
    accountDetails: string;
    name: string;
    email: string;
    role: string;
    editProfile: string;
    editProfileDesc: string;
    displayName: string;
    emailAddress: string;
    saveChanges: string;
    saving: string;
    changePassword: string;
    changePasswordDesc: string;
    currentPassword: string;
    newPassword: string;
    confirmNewPassword: string;
    changing: string;
    preferences: string;
    customizeExperience: string;
    notifications: string;
    emailUpdates: string;
    theme: string;
    followingSystem: string;
    usingMode: string;
    language: string;
    languageEnglish: string;
    languageSpanish: string;
    preferencesUpdated: string;
    notificationSettings: string;
    emailSettings: string;
    languageSettings: string;
    noChanges: string;
    noChangesDesc: string;
    passwordsDontMatch: string;
    passwordsDontMatchDesc: string;
  };

  // Help & Support
  help: {
    title: string;
    subtitle: string;
    cantFindAnswer: string;
    useChat: string;
    chatTitle: string;
    chatWelcome: string;
    chatPlaceholder: string;
    chatNoMatch: string;
    raiseTicket: string;
    ticketSubject: string;
    ticketDesc: string;
    submitTicket: string;
    submitting: string;
    ticketSent: string;
    ticketSuccess: string;
    ticketFailed: string;
  };

  // Admin
  admin: {
    title: string;
    subtitle: string;
    bulkImport: string;
    pendingRequests: string;
    createUser: string;
    totalUsers: string;
    activeUsers: string;
    pendingApproval: string;
    suspended: string;
    filters: string;
    filtersDesc: string;
    searchPlaceholder: string;
    allRoles: string;
    allStatuses: string;
    active: string;
    pending: string;
    inactive: string;
    users: string;
    showingUsers: string;
    noUsersFound: string;
    serialNo: string;
    name: string;
    email: string;
    role: string;
    status: string;
    created: string;
    actions: string;
    page: string;
    showingEntries: string;
    deleteTitle: string;
    deleteConfirm: string;
    deleteSuccess: string;
    deleteFailed: string;
    perPage: string;
  };
}
