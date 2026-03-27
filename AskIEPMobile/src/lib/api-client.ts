import { authService } from './auth-service';
import { secureStore } from './secure-store';

type UnauthorizedCallback = () => void;

let onUnauthorized: UnauthorizedCallback | null = null;

export function setUnauthorizedCallback(cb: UnauthorizedCallback): void {
  onUnauthorized = cb;
}

/**
 * Authenticated fetch wrapper.
 * - Attaches JWT bearer token
 * - Auto-refreshes on 401
 * - Falls back to sign-out on refresh failure
 * - Returns plain-language errors (NFR25)
 * - Never exposes PII in error messages (NFR10)
 */
export async function apiRequest<T = any>(
  url: string,
  options: RequestInit = {},
): Promise<T> {
  const token = await secureStore.getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(url, {...options, headers});
  } catch {
    throw new Error('Could not reach server. Please check your connection and try again.');
  }

  // Handle 401 — try token refresh once
  if (response.status === 401) {
    const refreshToken = await secureStore.getRefreshToken();
    if (refreshToken) {
      try {
        const result = await authService.refreshAccessToken(refreshToken);
        await secureStore.saveTokens({
          token: result.token,
          refreshToken: result.refreshToken,
        });

        // Retry with new token
        headers.Authorization = `Bearer ${result.token}`;
        const retryResponse = await fetch(url, {...options, headers});
        if (retryResponse.ok) {
          return retryResponse.json();
        }
        if (retryResponse.status === 401) {
          await secureStore.clearTokens();
          onUnauthorized?.();
          throw new Error('Your session has expired. Please sign in again.');
        }
        return handleErrorResponse(retryResponse);
      } catch (e: any) {
        if (e.message?.includes('session has expired')) {
          throw e;
        }
        await secureStore.clearTokens();
        onUnauthorized?.();
        throw new Error('Your session has expired. Please sign in again.');
      }
    } else {
      await secureStore.clearTokens();
      onUnauthorized?.();
      throw new Error('Your session has expired. Please sign in again.');
    }
  }

  if (!response.ok) {
    return handleErrorResponse(response);
  }

  return response.json();
}

async function handleErrorResponse(response: Response): Promise<never> {
  let message = 'Something went wrong. Please try again.';

  try {
    const body = await response.json();
    if (body.message && typeof body.message === 'string') {
      message = sanitizeMessage(body.message);
    }
  } catch {
    // Response isn't JSON — use generic message
  }

  if (response.status >= 500) {
    message = 'Server error. Please try again in a moment.';
  } else if (response.status === 404) {
    message = 'The requested resource was not found.';
  } else if (response.status === 403) {
    message = 'You don\'t have permission to perform this action.';
  }

  throw new Error(message);
}

function sanitizeMessage(message: string): string {
  // Strip potential PII patterns (NFR10)
  return message
    .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[email]')
    .replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[phone]')
    .substring(0, 200);
}
