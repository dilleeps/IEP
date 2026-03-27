import { API } from './api-config';

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  role: 'PARENT' | 'ADVOCATE' | 'TEACHER_THERAPIST';
  status: 'active' | 'pending' | 'suspended' | 'inactive';
  provider: 'google' | 'internal';
  isApproved: boolean;
  isActive: boolean;
  isNewUser?: boolean;
}

export interface ExchangeTokenResponse {
  user: AuthUser;
  token: string;
  refreshToken: string;
  isNewUser: boolean;
  requiresSetup: boolean;
}

export interface RefreshTokenResponse {
  token: string;
  refreshToken: string;
}

export const authService = {
  async exchangeFirebaseToken(
    firebaseIdToken: string,
  ): Promise<ExchangeTokenResponse> {
    const response = await fetch(API.exchangeToken, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({firebaseToken: firebaseIdToken}),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `Auth failed (${response.status})`);
    }

    return response.json();
  },

  async refreshAccessToken(
    refreshToken: string,
  ): Promise<RefreshTokenResponse> {
    const response = await fetch(API.refreshToken, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({refreshToken}),
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    return response.json();
  },

  async revokeToken(token: string): Promise<void> {
    await fetch(API.logout, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
  },
};
