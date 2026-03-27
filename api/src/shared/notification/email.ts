import nodemailer from 'nodemailer';

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

// ─── Provider detection ───────────────────────────────────────────────────────

function hasAzureCredentials(): boolean {
  return !!(
    process.env.AZURE_TENANT_ID &&
    process.env.AZURE_CLIENT_ID &&
    process.env.AZURE_CLIENT_SECRET
  );
}

function hasSmtpCredentials(): boolean {
  return !!(
    process.env.SES_SMTP_HOST &&
    process.env.SES_SMTP_USER &&
    process.env.SES_SMTP_PASS
  );
}

// ─── SMTP / SES Transport ────────────────────────────────────────────────────

let smtpTransport: nodemailer.Transporter | null = null;

function getSmtpTransport(): nodemailer.Transporter {
  if (!smtpTransport) {
    smtpTransport = nodemailer.createTransport({
      host: process.env.SES_SMTP_HOST,
      port: 587,
      secure: false,
      auth: {
        user: process.env.SES_SMTP_USER!,
        pass: process.env.SES_SMTP_PASS!,
      },
    });
  }
  return smtpTransport;
}

function getFromEmailAddress(): string {
  const fromEmail = process.env.FROM_EMAIL_ADDRESS;
  if (!fromEmail) {
    throw new Error('Failed to get FROM_EMAIL_ADDRESS');
  }
  return fromEmail;
}

async function sendViaSmtp(
  toAddress: string,
  subject: string,
  content: string,
  isHtml: boolean,
): Promise<void> {
  const transport = getSmtpTransport();
  const from = getFromEmailAddress();

  await transport.sendMail({
    from,
    to: toAddress,
    subject,
    ...(isHtml ? { html: content } : { text: content }),
  });
}

// ─── Microsoft Graph API ──────────────────────────────────────────────────────

function getAzureCredentials(): AzureCredentials {
  const tenantId = process.env.AZURE_TENANT_ID;
  const clientId = process.env.AZURE_CLIENT_ID;
  const clientSecret = process.env.AZURE_CLIENT_SECRET;

  if (!tenantId || !clientId || !clientSecret) {
    throw new Error('Missing Azure credentials: AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET');
  }

  return { tenantId, clientId, clientSecret };
}

async function getGraphAccessToken(): Promise<string> {
  const creds = getAzureCredentials();
  const tokenUrl = `https://login.microsoftonline.com/${creds.tenantId}/oauth2/v2.0/token`;

  const params = new URLSearchParams({
    client_id: creds.clientId,
    scope: 'https://graph.microsoft.com/.default',
    client_secret: creds.clientSecret,
    grant_type: 'client_credentials',
  });

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
}

async function sendViaGraph(
  toAddress: string,
  subject: string,
  content: string,
  contentType: 'Text' | 'HTML',
): Promise<void> {
  const fromUser = getFromEmailAddress();
  const token = await getGraphAccessToken();

  const emailPayload = {
    message: {
      subject,
      body: { contentType, content },
      toRecipients: [{ emailAddress: { address: toAddress } }],
    },
    saveToSentItems: true,
  };

  const response = await fetch(
    `https://graph.microsoft.com/v1.0/users/${fromUser}/sendMail`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailPayload),
    },
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Graph API sendMail failed: ${error}`);
  }
}

// ─── Unified send function (Graph → SMTP fallback) ───────────────────────────

async function sendEmailInternal(
  toAddress: string,
  subject: string,
  content: string,
  isHtml: boolean,
): Promise<void> {
  // Try Microsoft Graph first if configured
  if (hasAzureCredentials()) {
    await sendViaGraph(toAddress, subject, content, isHtml ? 'HTML' : 'Text');
    return;
  }

  // Fallback to SMTP/SES
  if (hasSmtpCredentials()) {
    await sendViaSmtp(toAddress, subject, content, isHtml);
    return;
  }

  throw new Error(
    'No email provider configured. Set AZURE_TENANT_ID/CLIENT_ID/CLIENT_SECRET for Graph API, or SES_SMTP_HOST/USER/PASS for SMTP.',
  );
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Send plain text email
 */
export async function sendEmailSync(
  toAddress: string,
  subject: string,
  msg: string,
): Promise<void> {
  await sendEmailInternal(toAddress, subject, msg, false);
}

/**
 * Send HTML email
 */
export async function sendHtmlEmail(
  toAddress: string,
  subject: string,
  htmlContent: string,
): Promise<void> {
  await sendEmailInternal(toAddress, subject, htmlContent, true);
}

/**
 * Send email with file attachment via Microsoft Graph API.
 * Falls back to SMTP with attachment if Graph is unavailable.
 */
export async function sendEmailWithAttachment(
  toAddress: string,
  subject: string,
  msg: string,
  attachmentName: string,
  attachmentData: Buffer | Uint8Array,
): Promise<void> {
  const buffer = Buffer.isBuffer(attachmentData)
    ? attachmentData
    : Buffer.from(attachmentData);

  // Try Graph API first
  if (hasAzureCredentials()) {
    const fromUser = getFromEmailAddress();
    const token = await getGraphAccessToken();
    const base64Content = buffer.toString('base64');

    const emailPayload = {
      message: {
        subject,
        body: { contentType: 'Text', content: msg },
        toRecipients: [{ emailAddress: { address: toAddress } }],
        attachments: [
          {
            '@odata.type': '#microsoft.graph.fileAttachment',
            name: attachmentName,
            contentType: 'application/octet-stream',
            contentBytes: base64Content,
          },
        ],
      },
      saveToSentItems: true,
    };

    const response = await fetch(
      `https://graph.microsoft.com/v1.0/users/${fromUser}/sendMail`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailPayload),
      },
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Graph API sendMail with attachment failed: ${error}`);
    }
    return;
  }

  // Fallback to SMTP with attachment
  if (hasSmtpCredentials()) {
    const transport = getSmtpTransport();
    const from = getFromEmailAddress();

    await transport.sendMail({
      from,
      to: toAddress,
      subject,
      text: msg,
      attachments: [
        {
          filename: attachmentName,
          content: buffer,
        },
      ],
    });
    return;
  }

  throw new Error('No email provider configured.');
}

/**
 * Send HTML email with an embedded ICS calendar invite.
 * The ICS is sent as an alternative MIME part (method: REQUEST)
 * so email clients render Accept/Decline/Tentative buttons.
 */
export async function sendHtmlEmailWithCalendarInvite(
  toAddress: string,
  subject: string,
  htmlContent: string,
  icsContent: string,
): Promise<void> {
  // SMTP path — supports raw MIME alternatives for calendar invites
  if (hasSmtpCredentials()) {
    const transport = getSmtpTransport();
    const from = getFromEmailAddress();

    await transport.sendMail({
      from: `"AskIEP Consultations" <${from}>`,
      to: toAddress,
      subject,
      html: htmlContent,
      alternatives: [
        {
          contentType: 'text/calendar; charset="UTF-8"; method=REQUEST',
          content: icsContent,
        },
      ],
      icalEvent: {
        method: 'REQUEST',
        content: icsContent,
      },
    });
    return;
  }

  // Graph API fallback — attach ICS as file (no inline invite buttons, but still works)
  if (hasAzureCredentials()) {
    const fromUser = getFromEmailAddress();
    const token = await getGraphAccessToken();

    const emailPayload = {
      message: {
        subject,
        body: { contentType: 'HTML', content: htmlContent },
        toRecipients: [{ emailAddress: { address: toAddress } }],
        attachments: [
          {
            '@odata.type': '#microsoft.graph.fileAttachment',
            name: 'invite.ics',
            contentType: 'text/calendar; method=REQUEST',
            contentBytes: Buffer.from(icsContent).toString('base64'),
          },
        ],
      },
      saveToSentItems: true,
    };

    const response = await fetch(
      `https://graph.microsoft.com/v1.0/users/${fromUser}/sendMail`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailPayload),
      },
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Graph API sendMail with calendar invite failed: ${error}`);
    }
    return;
  }

  throw new Error('No email provider configured.');
}

/**
 * Legacy sendEmail wrapper for compatibility
 */
export async function sendEmail(
  params: { to: string; subject: string; body: string },
  _data?: any,
  _template?: any,
): Promise<void> {
  await sendEmailSync(params.to, params.subject, params.body);
}
