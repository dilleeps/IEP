import { Lead } from "./lead.model.js";
import { AppError } from "../shared/errors/appError.js";
import {
  CreateLeadRequest,
  LeadResponse,
  LeadsListResponse,
  RecaptchaVerifyResponse,
} from "./lead.types.js";
import { appenv } from "../config/appenv.js";
import { sendTelegramMessage } from "../shared/notification/telegram.js";
import { sendEmailWithAttachment } from "../shared/notification/email.js";

export class LeadService {
  private readonly RECAPTCHA_SECRET = appenv.get("RECAPTCHA_SECRET") || "";
  private readonly RECAPTCHA_MIN_SCORE = parseFloat(appenv.get("RECAPTCHA_MIN_SCORE") || "0.5");
  private readonly RECAPTCHA_VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify";

  /**
   * Verify reCAPTCHA token with Google
   */
  private async verifyRecaptcha(token: string, remoteIP?: string): Promise<RecaptchaVerifyResponse> {
    if (!this.RECAPTCHA_SECRET) {
      throw new AppError("reCAPTCHA not configured", 500, "RECAPTCHA_MISCONFIGURED");
    }

    const params = new URLSearchParams({
      secret: this.RECAPTCHA_SECRET,
      response: token,
    });

    if (remoteIP) {
      params.append("remoteip", remoteIP);
    }

    try {
      const response = await fetch(this.RECAPTCHA_VERIFY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(),
      });

      if (!response.ok) {
        throw new Error(`reCAPTCHA API returned ${response.status}`);
      }

      return (await response.json()) as RecaptchaVerifyResponse;
    } catch {
      throw new AppError("Failed to verify reCAPTCHA", 500, "RECAPTCHA_VERIFY_FAILED");
    }
  }

  /**
   * Create new lead with reCAPTCHA verification + async notifications
   */
  async createLead(data: CreateLeadRequest, ip?: string, userAgent?: string): Promise<LeadResponse> {
    const { email, recaptchaToken, recaptchaAction } = data;

    // Verify reCAPTCHA
    const verifyResult = await this.verifyRecaptcha(recaptchaToken, ip);

    if (!verifyResult.success) {
      console.error("reCAPTCHA verification failed:", {
        success: verifyResult.success,
        errorCodes: verifyResult["error-codes"],
        score: verifyResult.score,
        action: verifyResult.action,
      });
      throw new AppError("reCAPTCHA verification failed", 429, "RECAPTCHA_FAILED");
    }

    if (verifyResult.score !== undefined && verifyResult.score < this.RECAPTCHA_MIN_SCORE) {
      throw new AppError("reCAPTCHA score too low", 429, "RECAPTCHA_SCORE_LOW");
    }

    if (recaptchaAction && verifyResult.action && recaptchaAction !== verifyResult.action) {
      throw new AppError("reCAPTCHA action mismatch", 429, "RECAPTCHA_ACTION_MISMATCH");
    }

    // Create lead (DB)
    const lead = await Lead.create({
      email,
      ip,
      userAgent,
      captchaScore: verifyResult.score,
      captchaAction: verifyResult.action,
    } as any);

    // Fire-and-forget notifications (DB-backed summaries + CSV attachment)
    runAsync("lead-telegram", async () => sendTelegramLeadNotification(lead));
    runAsync("lead-email", async () => sendEmailLeadNotification(lead));

    return this.toLeadResponse(lead);
  }

  async listLeads(limit: number = 50, offset: number = 0): Promise<LeadsListResponse> {
    const { count, rows } = await Lead.findAndCountAll({
      limit,
      offset,
      order: [["createdAt", "DESC"]],
    });

    return {
      leads: rows.map((lead) => this.toLeadResponse(lead)),
      total: count,
      limit,
      offset,
    };
  }

  async getLeadCount(): Promise<number> {
    return await Lead.count();
  }

  async getRecentLeads(limit: number = 10): Promise<LeadResponse[]> {
    const leads = await Lead.findAll({
      limit,
      order: [["createdAt", "DESC"]],
    });

    return leads.map((lead) => this.toLeadResponse(lead));
  }

  private toLeadResponse(lead: Lead): LeadResponse {
    return {
      id: lead.id,
      email: lead.email,
      ip: lead.ip,
      userAgent: lead.userAgent,
      captchaScore: lead.captchaScore,
      captchaAction: lead.captchaAction,
      createdAt: lead.createdAt,
    };
  }

  generateLeadsCSV(leads: LeadResponse[]): string {
    const header = "ID,Email,IP,User Agent,Captcha Score,Captcha Action,Created At\n";

    const rows = leads.map((lead) => {
      const escapeCSV = (str: string | undefined) => (str ? `"${str.replace(/"/g, '""')}"` : '""');

      return [
        lead.id,
        escapeCSV(lead.email),
        escapeCSV(lead.ip),
        escapeCSV(lead.userAgent),
        lead.captchaScore?.toFixed(2) || "N/A",
        escapeCSV(lead.captchaAction),
        lead.createdAt.toISOString(),
      ].join(",");
    });

    return header + rows.join("\n");
  }
}

// ===================== DB-backed Notifications =====================

function runAsync(label: string, fn: () => Promise<void>) {
  void fn().catch((err) => console.error(`[async:${label}]`, err));
}

/**
 * Telegram: show total + recent list (like your Go handler)
 */
async function sendTelegramLeadNotification(lead: Lead): Promise<void> {
  const totalLeads = await safeCountLeads();
  const recentLeads = await safeRecentLeads(10);

  const when = formatDateIST(lead.createdAt);

  let message =
    `🎯 *New Lead Submission*\n\n` +
    `📊 *Total Leads:* ${totalLeads}\n` +
    `📈 *Recent (Last 10):* ${recentLeads.length}\n\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `📧 *Email:* \`${escapeTelegramCode(lead.email)}\`\n` +
    `🌐 *IP:* \`${escapeTelegramCode(lead.ip ?? "")}\`\n` +
    `📅 *Date:* ${when}\n`;

  if (typeof lead.captchaScore === "number") {
    message += `🧠 *Captcha Score:* \`${lead.captchaScore.toFixed(2)}\`\n`;
  }
  if (lead.captchaAction) {
    message += `🎬 *Action:* \`${escapeTelegramCode(lead.captchaAction)}\`\n`;
  }

  if (recentLeads.length > 1) {
    message += `\n━━━━━━━━━━━━━━━━━━━━━━━\n*Recent Submissions:*\n\n`;

    let count = 0;
    for (const r of recentLeads) {
      if (r.id === lead.id) continue;
      if (count >= 5) break;

      message += `• ${r.email} - ${formatShortIST(r.createdAt)}\n`;
      count++;
    }
  }

  await sendTelegramMessage(message);
}

/**
 * Email: send CSV attachment of last 100 leads to NOTIFY_EMAILS
 */
async function sendEmailLeadNotification(lead: Lead): Promise<void> {
  const notifyEmailsRaw = (appenv.get("NOTIFY_EMAILS") ?? "").trim();
  if (!notifyEmailsRaw) return;

  const emailList = notifyEmailsRaw
    .split(";")
    .map((e) => e.trim())
    .filter(Boolean);

  if (emailList.length === 0) return;

  const totalLeads = await safeCountLeads();
  const recent100 = await safeRecentLeads(100);

  const csvData = generateLeadCSV(recent100);
  const filename = `leads_${formatFilenameDate(new Date())}.csv`;

  const scoreStr = typeof lead.captchaScore === "number" ? lead.captchaScore.toFixed(2) : "N/A";

  const subject = `🆕 New Lead Submission - Askiep (Total: ${totalLeads})`;
  const body =
    `═══════════════════════════════════════\n` +
    `📊 LEAD INSIGHTS\n` +
    `═══════════════════════════════════════\n` +
    `Total Leads: ${totalLeads}\n` +
    `Recent Submissions (Last 100): ${recent100.length}\n\n` +
    `═══════════════════════════════════════\n` +
    `🆕 LATEST SUBMISSION\n` +
    `═══════════════════════════════════════\n` +
    `Email: ${lead.email}\n` +
    `IP: ${lead.ip ?? ""}\n` +
    `User Agent: ${lead.userAgent ?? ""}\n` +
    `Captcha Score: ${scoreStr}\n` +
    `Captcha Action: ${lead.captchaAction ?? "N/A"}\n` +
    `Date: ${lead.createdAt.toISOString()}\n\n` +
    `📎 A CSV file with the last 100 leads is attached.\n`;

  const attachment = typeof Buffer !== "undefined" ? Buffer.from(csvData, "utf-8") : csvData;

  try {
    // Send one email with all recipients in the "To" field
    await sendEmailWithAttachment(emailList.join(","), subject, body, filename, attachment as any);
  } catch (err) {
    console.error(`Failed to send email notification to ${emailList.join(", ")}:`, err);
  }
}

// ===================== DB helpers (safe) =====================

async function safeCountLeads(): Promise<number> {
  try {
    return await Lead.count();
  } catch (err) {
    console.error("Failed to count leads:", err);
    return 0;
  }
}

async function safeRecentLeads(limit: number): Promise<Array<{ id: string; email: string; createdAt: Date }>> {
  try {
    const rows = await Lead.findAll({
      limit,
      order: [["createdAt", "DESC"]],
      attributes: ["id", "email", "createdAt"],
    });

    return rows.map((r: any) => ({
      id: String(r.id),
      email: String(r.email),
      createdAt: new Date(r.createdAt),
    }));
  } catch (err) {
    console.error("Failed to fetch recent leads:", err);
    return [];
  }
}

// ===================== CSV helpers =====================

function generateLeadCSV(leads: Array<{ email: string; ip?: string | null; userAgent?: string | null; captchaScore?: number | null; captchaAction?: string | null; createdAt: Date }>): string {
  const header = "Email,IP,User Agent,Captcha Score,Captcha Action,Created At\n";

  const rows = leads.map((l: any) => {
    const score = typeof l.captchaScore === "number" ? l.captchaScore.toFixed(2) : "N/A";
    return [
      csvEscape(l.email),
      csvEscape(l.ip ?? ""),
      csvEscape(l.userAgent ?? ""),
      score,
      csvEscape(l.captchaAction ?? ""),
      new Date(l.createdAt).toISOString(),
    ].join(",");
  });

  return header + rows.join("\n");
}

function csvEscape(s: string): string {
  const v = String(s ?? "");
  return `"${v.replace(/"/g, '""')}"`;
}

// ===================== Formatting helpers =====================

function escapeTelegramCode(s: string): string {
  return (s ?? "").replace(/`/g, "'");
}

function formatFilenameDate(d: Date): string {
  const pad = (x: number) => String(x).padStart(2, "0");
  return (
    d.getUTCFullYear().toString() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    "_" +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds())
  );
}

function formatDateIST(d: Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(d);
}

function formatShortIST(d: Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    month: "short",
    day: "2-digit",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(d);
}
