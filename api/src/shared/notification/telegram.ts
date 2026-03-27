// notification/telegram.ts

// If appenv is global, remove this import
import { appenv } from "../../config/appenv.js";

type TelegramPayload = {
  chat_id: number;
  text: string;
  parse_mode?: string;
};

type TelegramResponse = {
  ok: boolean;
  description?: string;
};



/**
 * Send a text message to the configured Telegram chat
 */
export async function sendTelegramMessage(text: string): Promise<void> {
  const apiKey = appenv.get("TELEGRAM_API_KEY");
  if (!apiKey) {
    throw new Error("failed to get TELEGRAM_API_KEY");
  }

  const chatIDStr = appenv.get("TELEGRAM_CHAT_ID");
  if (!chatIDStr) {
    throw new Error("failed to get TELEGRAM_CHAT_ID");
  }

  const chatID = Number(chatIDStr);
  if (Number.isNaN(chatID)) {
    throw new Error(`invalid TELEGRAM_CHAT_ID: ${chatIDStr}`);
  }

  const payload: TelegramPayload = {
    chat_id: chatID,
    text,
  };

  const url = `https://api.telegram.org/bot${apiKey}/sendMessage`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000); // Increased to 30s for Cloud Run

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timeout);
    // Don't throw on network errors - log and continue
    console.error(`[telegram] Failed to send message: ${(err as Error).message}`);
    return; // Gracefully fail
  } finally {
    clearTimeout(timeout);
  }

  let tgResp: TelegramResponse;
  try {
    tgResp = await response.json();
  } catch {
    throw new Error("failed to decode Telegram response");
  }

  if (!tgResp.ok) {
    throw new Error(
      `Telegram API returned error: ${tgResp.description ?? "unknown error"} (HTTP ${response.status})`
    );
  }
}
