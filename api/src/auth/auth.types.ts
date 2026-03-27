export interface RegisterDto {
  email: string;
  password: string;
  displayName: string;
  role?: 'PARENT' | 'ADVOCATE' | 'TEACHER_THERAPIST' | 'COUNSELOR' | 'SUPPORT';
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RefreshTokenDto {
  refreshToken: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    displayName: string;
    role: string;
    status: string;
    provider: string;
    isApproved: boolean;
    isActive: boolean;
  };
  token: string;
  refreshToken: string;
  requiresSetup?: boolean;
  needsOnboarding?: boolean;
}

export interface TokenPayload {
  sub: string;
  email: string;
  role: string;
  status: string;
  isApproved: boolean;
}

export interface ExchangeFirebaseTokenDto {
  firebaseToken: string;
}

export interface ExchangeTokenResponse extends AuthResponse {
  isNewUser: boolean;
  requiresSetup: boolean;
  needsOnboarding: boolean;
}
