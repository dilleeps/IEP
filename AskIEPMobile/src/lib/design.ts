// AskIEP Design System — aligned with web UI (apps/ui)
// Primary: Indigo #5B5AF7 | Logo: Sage Green #7FB89E + Coral #C07856

export const Colors = {
  // Brand
  primary: '#5B5AF7',
  primaryHover: '#4A49E8',
  primaryLight: '#EEF2FF',
  primaryGlow: 'rgba(91, 90, 247, 0.45)',
  green: '#7FB89E',
  greenLight: '#E8F5EE',
  coral: '#C07856',
  coralLight: '#FDE8D8',

  // Surfaces
  background: '#FEFFFE',
  card: '#FFFFFF',
  secondary: '#F3F4F6',
  surfaceElevated: '#FFFFFF',

  // Text
  text: '#2D2D2D',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  textOnPrimary: '#FFFFFF',

  // Borders
  border: '#E5E7EB',
  borderLight: '#F3F4F6',

  // Semantic
  success: '#10B981',
  successLight: '#ECFDF5',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  error: '#EF4444',
  errorLight: '#FEF2F2',
  info: '#0EA5E9',
  infoLight: '#F0F9FF',

  // Chart/accent palette (matches web)
  indigo: '#5B5AF7',
  purple: '#8B5CF6',
  blue: '#0EA5E9',
  amber: '#EAB308',
  emerald: '#10B981',
} as const;

/** Colors used when the device is in dark mode */
export const DarkColors = {
  // Brand (same — stays vibrant in dark mode)
  primary: '#7B7AF9',
  primaryHover: '#6B6AEA',
  primaryLight: '#1E1B4B',
  primaryGlow: 'rgba(123, 122, 249, 0.45)',
  green: '#7FB89E',
  greenLight: '#1A2E25',
  coral: '#D4936A',
  coralLight: '#2D1A12',

  // Surfaces
  background: '#0F0F10',
  card: '#1A1A1E',
  secondary: '#252529',
  surfaceElevated: '#222226',

  // Text
  text: '#F3F4F6',
  textSecondary: '#9CA3AF',
  textMuted: '#6B7280',
  textOnPrimary: '#FFFFFF',

  // Borders
  border: '#2D2D32',
  borderLight: '#1D1D21',

  // Semantic (slightly softened for dark bg)
  success: '#34D399',
  successLight: '#0A2E22',
  warning: '#FBBF24',
  warningLight: '#2D1F07',
  error: '#F87171',
  errorLight: '#2D0F0F',
  info: '#38BDF8',
  infoLight: '#082532',

  // Chart/accent
  indigo: '#7B7AF9',
  purple: '#A78BFA',
  blue: '#38BDF8',
  amber: '#FBBF24',
  emerald: '#34D399',
} as const;

export const Radius = {
  xs: 6,
  sm: 8,
  md: 10,
  lg: 14,
  card: 24,
  button: 16,
  section: 28,
  pill: 9999,
} as const;

export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 5,
  },
  primaryGlow: {
    shadowColor: '#5B5AF7',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 28,
    elevation: 8,
  },
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;
