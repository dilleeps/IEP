/** App-level configuration for store submission and legal compliance (Story 6.3) */
export const AppConfig = {
  appName: 'AskIEP',
  bundleId: {
    ios: 'com.askiep.mobile',
    android: 'com.askiep.mobile',
  },
  version: '1.0.0',
  buildNumber: '1',

  // Legal & compliance URLs
  privacyPolicyUrl: 'https://askiep.com/privacy',
  termsOfServiceUrl: 'https://askiep.com/terms',
  supportEmail: 'io@askiep.com',
  supportUrl: 'https://askiep.com/support',

  // Store metadata
  ageRating: '4+', // Parental/educational app — no objectionable content
  contentRating: 'Everyone', // Android equivalent

  // Data collection disclosure (iOS App Privacy / Android Data Safety)
  dataCollection: {
    collectsData: true,
    dataTypes: [
      {type: 'Name', purpose: 'App Functionality', linked: true},
      {type: 'Email Address', purpose: 'App Functionality', linked: true},
      {type: 'User Content', purpose: 'App Functionality', linked: true},
      {
        type: 'Health & Fitness',
        purpose: 'App Functionality',
        linked: true,
        description: 'IEP educational data for children with disabilities',
      },
    ],
    encryption: true,
    accountDeletion: true,
    thirdPartySharing: false,
  },
} as const;
