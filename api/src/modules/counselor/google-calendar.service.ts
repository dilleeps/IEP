import { randomUUID } from 'node:crypto';
import { appenv } from '../../config/appenv.js';

const GOOGLE_AUTH_BASE = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_CALENDAR_BASE = 'https://www.googleapis.com/calendar/v3';
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v3/userinfo';

export interface GoogleOAuthTokenResponse {
  accessToken: string;
  refreshToken: string | null;
  expiresIn: number | null;
  scope: string;
  tokenType: string;
}

export interface GoogleCalendarEventResult {
  eventId: string;
  meetLink: string | null;
}

export class GoogleCalendarService {
  private clientId = appenv.get('GOOGLE_OAUTH_CLIENT_ID');
  private clientSecret = appenv.get('GOOGLE_OAUTH_CLIENT_SECRET');
  private redirectUri = appenv.get('GOOGLE_OAUTH_REDIRECT_URI');
  private scopes = appenv.get('GOOGLE_OAUTH_SCOPES')
    || 'openid email profile https://www.googleapis.com/auth/calendar.events';

  isConfigured(): boolean {
    return !!(this.clientId && this.clientSecret && this.redirectUri);
  }

  getSuccessRedirectUrl(): string {
    return appenv.get('COUNSELOR_GOOGLE_SUCCESS_REDIRECT') || 'http://localhost:5173/counselor/profile?google=connected';
  }

  getFailureRedirectUrl(): string {
    return appenv.get('COUNSELOR_GOOGLE_FAILURE_REDIRECT') || 'http://localhost:5173/counselor/profile?google=failed';
  }

  buildConnectUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: this.scopes,
      access_type: 'offline',
      include_granted_scopes: 'true',
      prompt: 'consent',
      state,
    });

    return `${GOOGLE_AUTH_BASE}?${params.toString()}`;
  }

  async exchangeCodeForToken(code: string): Promise<GoogleOAuthTokenResponse> {
    const body = new URLSearchParams({
      code,
      client_id: this.clientId,
      client_secret: this.clientSecret,
      redirect_uri: this.redirectUri,
      grant_type: 'authorization_code',
    });

    const response = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });

    const json = await response.json() as Record<string, unknown>;
    if (!response.ok || typeof json.access_token !== 'string') {
      throw new Error(`Google token exchange failed: ${JSON.stringify(json)}`);
    }

    return {
      accessToken: json.access_token,
      refreshToken: typeof json.refresh_token === 'string' ? json.refresh_token : null,
      expiresIn: typeof json.expires_in === 'number' ? json.expires_in : null,
      scope: typeof json.scope === 'string' ? json.scope : '',
      tokenType: typeof json.token_type === 'string' ? json.token_type : 'Bearer',
    };
  }

  async refreshAccessToken(refreshToken: string): Promise<GoogleOAuthTokenResponse> {
    const body = new URLSearchParams({
      refresh_token: refreshToken,
      client_id: this.clientId,
      client_secret: this.clientSecret,
      grant_type: 'refresh_token',
    });

    const response = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });

    const json = await response.json() as Record<string, unknown>;
    if (!response.ok || typeof json.access_token !== 'string') {
      throw new Error(`Google token refresh failed: ${JSON.stringify(json)}`);
    }

    return {
      accessToken: json.access_token,
      refreshToken: typeof json.refresh_token === 'string' ? json.refresh_token : refreshToken,
      expiresIn: typeof json.expires_in === 'number' ? json.expires_in : null,
      scope: typeof json.scope === 'string' ? json.scope : '',
      tokenType: typeof json.token_type === 'string' ? json.token_type : 'Bearer',
    };
  }

  async getGoogleEmail(accessToken: string): Promise<string | null> {
    const response = await fetch(GOOGLE_USERINFO_URL, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      return null;
    }

    const json = await response.json() as Record<string, unknown>;
    if (typeof json.email !== 'string') {
      return null;
    }

    return json.email;
  }

  async createCalendarEvent(input: {
    accessToken: string;
    summary: string;
    description: string;
    timezone: string;
    startAt: string;
    endAt: string;
    attendees: string[];
  }): Promise<GoogleCalendarEventResult> {
    const body = {
      summary: input.summary,
      description: input.description,
      start: {
        dateTime: input.startAt,
        timeZone: input.timezone,
      },
      end: {
        dateTime: input.endAt,
        timeZone: input.timezone,
      },
      attendees: input.attendees.map((email) => ({ email })),
      conferenceData: {
        createRequest: {
          requestId: randomUUID(),
          conferenceSolutionKey: {
            type: 'hangoutsMeet',
          },
        },
      },
    };

    const response = await fetch(`${GOOGLE_CALENDAR_BASE}/calendars/primary/events?conferenceDataVersion=1`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${input.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const json = await response.json() as Record<string, unknown>;
    if (!response.ok || typeof json.id !== 'string') {
      throw new Error(`Google calendar create event failed: ${JSON.stringify(json)}`);
    }

    return {
      eventId: json.id,
      meetLink: this.extractMeetLink(json),
    };
  }

  async updateCalendarEvent(input: {
    accessToken: string;
    eventId: string;
    summary: string;
    description: string;
    timezone: string;
    startAt: string;
    endAt: string;
    attendees: string[];
  }): Promise<GoogleCalendarEventResult> {
    const body = {
      summary: input.summary,
      description: input.description,
      start: {
        dateTime: input.startAt,
        timeZone: input.timezone,
      },
      end: {
        dateTime: input.endAt,
        timeZone: input.timezone,
      },
      attendees: input.attendees.map((email) => ({ email })),
    };

    const response = await fetch(`${GOOGLE_CALENDAR_BASE}/calendars/primary/events/${encodeURIComponent(input.eventId)}?conferenceDataVersion=1`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${input.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const json = await response.json() as Record<string, unknown>;
    if (!response.ok || typeof json.id !== 'string') {
      throw new Error(`Google calendar update event failed: ${JSON.stringify(json)}`);
    }

    return {
      eventId: json.id,
      meetLink: this.extractMeetLink(json),
    };
  }

  private extractMeetLink(event: Record<string, unknown>): string | null {
    if (typeof event.hangoutLink === 'string') {
      return event.hangoutLink;
    }

    const conferenceData = event.conferenceData as Record<string, unknown> | undefined;
    const entryPoints = conferenceData?.entryPoints as Array<Record<string, unknown>> | undefined;
    if (!entryPoints || entryPoints.length === 0) {
      return null;
    }

    const videoEntry = entryPoints.find((item) => item.entryPointType === 'video');
    if (videoEntry && typeof videoEntry.uri === 'string') {
      return videoEntry.uri;
    }

    return null;
  }
}
