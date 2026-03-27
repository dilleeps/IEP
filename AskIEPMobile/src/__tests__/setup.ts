// Global test setup
// Mock environment variables before api-config loads
process.env.EXPO_PUBLIC_API_BASE_URL = 'https://test.askiep.com';
process.env.EXPO_PUBLIC_MOBILE_AUTH_URL = 'https://test.askiep.com/mobile-auth';

// Suppress console logs/warnings in tests
jest.spyOn(console, 'log').mockImplementation(() => {});
jest.spyOn(console, 'warn').mockImplementation(() => {});
jest.spyOn(console, 'error').mockImplementation(() => {});

// Mock expo's winter runtime to prevent dynamic import issues in Jest 30
jest.mock('expo/src/winter/runtime.native', () => {});
jest.mock('expo/src/winter/installGlobal', () => ({
  installGlobal: jest.fn(),
}));

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
    replace: jest.fn(),
  }),
  useLocalSearchParams: () => ({}),
  useSegments: () => [],
  useRootNavigationState: () => ({key: 'test'}),
}));

// Mock expo-secure-store
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));

// Mock expo-local-authentication
jest.mock('expo-local-authentication', () => ({
  hasHardwareAsync: jest.fn().mockResolvedValue(false),
  isEnrolledAsync: jest.fn().mockResolvedValue(false),
  authenticateAsync: jest.fn().mockResolvedValue({success: false}),
  supportedAuthenticationTypesAsync: jest.fn().mockResolvedValue([]),
  SecurityLevel: {NONE: 0, SECRET: 1, BIOMETRIC: 2},
  AuthenticationType: {FINGERPRINT: 1, FACIAL_RECOGNITION: 2, IRIS: 3},
}));

// Mock expo-document-picker
jest.mock('expo-document-picker', () => ({
  getDocumentAsync: jest.fn().mockResolvedValue({canceled: true}),
}));

// Mock expo-web-browser
jest.mock('expo-web-browser', () => ({
  openAuthSessionAsync: jest.fn().mockResolvedValue({type: 'cancel'}),
  openBrowserAsync: jest.fn(),
  maybeCompleteAuthSession: jest.fn(),
}));

// Mock expo-apple-authentication
jest.mock('expo-apple-authentication', () => ({
  signInAsync: jest.fn(),
  AppleAuthenticationScope: {
    FULL_NAME: 0,
    EMAIL: 1,
  },
}));

// Mock expo-haptics
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  selectionAsync: jest.fn(),
}));

// Mock expo-network
jest.mock('expo-network', () => ({
  getNetworkStateAsync: jest.fn().mockResolvedValue({
    isConnected: true,
    isInternetReachable: true,
  }),
}));

// Mock expo-constants
jest.mock('expo-constants', () => ({
  default: {
    expoConfig: {
      extra: {},
    },
  },
}));

// Mock @react-native-async-storage/async-storage
jest.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: jest.fn().mockResolvedValue(null),
    setItem: jest.fn().mockResolvedValue(undefined),
    removeItem: jest.fn().mockResolvedValue(undefined),
    multiGet: jest.fn().mockResolvedValue([]),
    multiSet: jest.fn().mockResolvedValue(undefined),
    multiRemove: jest.fn().mockResolvedValue(undefined),
    clear: jest.fn().mockResolvedValue(undefined),
    getAllKeys: jest.fn().mockResolvedValue([]),
  },
}));

// Mock firebase
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(),
  getApps: jest.fn(() => []),
  getApp: jest.fn(),
}));

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({})),
  signInWithPopup: jest.fn(),
  signInWithRedirect: jest.fn(),
  signInWithCredential: jest.fn(),
  signOut: jest.fn(),
  getRedirectResult: jest.fn().mockResolvedValue(null),
  GoogleAuthProvider: jest.fn(),
  OAuthProvider: jest.fn(() => ({credential: jest.fn()})),
  initializeAuth: jest.fn(() => ({})),
  getReactNativePersistence: jest.fn(),
}));

// Mock the internal firebase module
jest.mock('../lib/firebase', () => ({
  firebaseAuth: {},
}));

// Mock secure-store service
jest.mock('../lib/secure-store', () => ({
  secureStore: {
    getToken: jest.fn().mockResolvedValue(null),
    getRefreshToken: jest.fn().mockResolvedValue(null),
    saveTokens: jest.fn().mockResolvedValue(undefined),
    clearTokens: jest.fn().mockResolvedValue(undefined),
    getItem: jest.fn().mockResolvedValue(null),
    setItem: jest.fn().mockResolvedValue(undefined),
  },
}));

// Mock auth-service
jest.mock('../lib/auth-service', () => ({
  authService: {
    exchangeFirebaseToken: jest.fn(),
    refreshAccessToken: jest.fn(),
    revokeToken: jest.fn(),
  },
}));

// Mock biometric-service
jest.mock('../lib/biometric-service', () => ({
  biometricService: {
    getAvailableBiometryType: jest.fn().mockResolvedValue(null),
    authenticate: jest.fn().mockResolvedValue(false),
  },
}));

// Mock app-config
jest.mock('../lib/app-config', () => ({
  AppConfig: {
    version: '1.0.0-test',
    privacyPolicyUrl: 'https://test.askiep.com/privacy',
    termsOfServiceUrl: 'https://test.askiep.com/terms',
    supportEmail: 'test@askiep.com',
  },
}));

// Mock http-stream
jest.mock('../lib/http-stream', () => ({
  streamNDJSON: jest.fn().mockResolvedValue({abort: jest.fn()}),
}));

// Mock api-client
jest.mock('../lib/api-client', () => ({
  apiRequest: jest.fn().mockResolvedValue({}),
}));

// Mock image require
jest.mock('../../assets/images/icon.png', () => 'mock-icon');
