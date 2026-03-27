interface AzureCredentials {
  tenantId: string;
  clientId: string;
  clientSecret: string;
}

interface GraphAccessToken {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface CalendarEventResponse {
  id: string;
  subject: string;
  onlineMeeting?: {
    joinUrl: string;
  };
  webLink: string;
}

export interface MeetingInviteParams {
  toEmail: string;
  subject: string;
  bodyContent: string;
  startDateTime: string; // ISO 8601 format: "2026-03-03T10:00:00"
  endDateTime: string; // ISO 8601 format: "2026-03-03T10:30:00"
  timeZone?: string; // Default: "Asia/Kolkata"
  isOnlineMeeting?: boolean; // Default: true
}

/**
 * Get Azure AD credentials from environment variables
 */
function getAzureCredentials(): AzureCredentials {
  const tenantId = process.env.AZURE_TENANT_ID;
  const clientId = process.env.AZURE_CLIENT_ID;
  const clientSecret = process.env.AZURE_CLIENT_SECRET;

  if (!tenantId || !clientId || !clientSecret) {
    throw new Error('Missing Azure credentials: AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET');
  }

  return { tenantId, clientId, clientSecret };
}

/**
 * Get FROM email address (organizer mailbox in M365 tenant)
 */
function getOrganizerEmail(): string {
  const fromEmail = process.env.FROM_EMAIL_ADDRESS;

  if (!fromEmail) {
    throw new Error('Failed to get FROM_EMAIL_ADDRESS');
  }

  return fromEmail;
}

/**
 * Get Microsoft Graph API access token using client credentials flow
 */
async function getGraphAccessToken(): Promise<string> {
  const creds = getAzureCredentials();
  const tokenUrl = `https://login.microsoftonline.com/${creds.tenantId}/oauth2/v2.0/token`;

  const params = new URLSearchParams({
    client_id: creds.clientId,
    scope: 'https://graph.microsoft.com/.default',
    client_secret: creds.clientSecret,
    grant_type: 'client_credentials',
  });

  try {
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to get access token: ${error}`);
    }

    const data = (await response.json()) as GraphAccessToken;
    return data.access_token;
  } catch (error) {
    throw new Error(
      `Failed to acquire Graph API token: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Create a calendar event with Teams meeting invite
 */
export async function createMeetingInvite(
  params: MeetingInviteParams
): Promise<CalendarEventResponse> {
  const organizerEmail = getOrganizerEmail();
  const token = await getGraphAccessToken();

  const timeZone = params.timeZone || 'Asia/Kolkata';
  const isOnlineMeeting = params.isOnlineMeeting !== false;

  const eventPayload = {
    subject: params.subject,
    body: {
      contentType: 'HTML',
      content: params.bodyContent,
    },
    start: {
      dateTime: params.startDateTime,
      timeZone,
    },
    end: {
      dateTime: params.endDateTime,
      timeZone,
    },
    attendees: [
      {
        emailAddress: { address: params.toEmail },
        type: 'required',
      },
    ],
    isOnlineMeeting,
    onlineMeetingProvider: isOnlineMeeting ? 'teamsForBusiness' : undefined,
  };

  try {
    const response = await fetch(
      `https://graph.microsoft.com/v1.0/users/${organizerEmail}/events`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventPayload),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Graph API create event failed: ${error}`);
    }

    const event = (await response.json()) as CalendarEventResponse;
    return event;
  } catch (error) {
    throw new Error(
      `Failed to create meeting invite: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Create multiple meeting invites for multiple attendees
 */
export async function createMeetingInviteForMultipleAttendees(
  attendeeEmails: string[],
  subject: string,
  bodyContent: string,
  startDateTime: string,
  endDateTime: string,
  timeZone = 'Asia/Kolkata'
): Promise<CalendarEventResponse> {
  const organizerEmail = getOrganizerEmail();
  const token = await getGraphAccessToken();

  const eventPayload = {
    subject,
    body: {
      contentType: 'HTML',
      content: bodyContent,
    },
    start: {
      dateTime: startDateTime,
      timeZone,
    },
    end: {
      dateTime: endDateTime,
      timeZone,
    },
    attendees: attendeeEmails.map((email) => ({
      emailAddress: { address: email },
      type: 'required',
    })),
    isOnlineMeeting: true,
    onlineMeetingProvider: 'teamsForBusiness',
  };

  try {
    const response = await fetch(
      `https://graph.microsoft.com/v1.0/users/${organizerEmail}/events`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventPayload),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Graph API create event failed: ${error}`);
    }

    const event = (await response.json()) as CalendarEventResponse;
    return event;
  } catch (error) {
    throw new Error(
      `Failed to create meeting invite for multiple attendees: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
