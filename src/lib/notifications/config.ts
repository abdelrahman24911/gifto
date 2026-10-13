import type { EmailConfig, GmailConfig, WhatsAppConfig } from "./types";

const DEFAULT_API_VERSION = "v21.0";
const DEFAULT_TEMPLATE_LANG = "en";

function clean(value: string | undefined): string {
  return (value ?? "").trim();
}

/**
 * Reads the Resend configuration for the active email channel from server-only
 * environment variables. The API key never leaves this process except inside the
 * outbound request to the provider; it is never logged or returned by callers.
 */
export function getEmailConfig(): EmailConfig | null {
  const apiKey = clean(process.env.RESEND_API_KEY);
  const from = clean(process.env.ORDER_NOTIFICATION_FROM);
  const to = clean(process.env.ORDER_NOTIFICATION_EMAIL);

  if (!apiKey || !from || !to) return null;

  return { apiKey, from, to };
}

/**
 * Reads the Gmail SMTP configuration for the active email channel from
 * server-only environment variables. The sender is always the authenticated
 * Gmail account (Gmail rejects forging another `From`); the recipient is the
 * owner address. The app password is never logged or returned by callers.
 */
export function getGmailConfig(): GmailConfig | null {
  const user = clean(process.env.GMAIL_USER);
  const pass = clean(process.env.GMAIL_APP_PASSWORD);
  const to = clean(process.env.ORDER_NOTIFICATION_EMAIL);

  if (!user || !pass || !to) return null;

  return { user, pass, from: `FL Tase3 <${user}>`, to };
}

export function isEmailConfigured(): boolean {
  return getGmailConfig() !== null || getEmailConfig() !== null;
}

/**
 * Reads the WhatsApp Cloud API configuration from server-only environment
 * variables. Dormant for now: nothing in the worker calls this unless WhatsApp
 * is explicitly wired up in the future. Never logs or returns secrets.
 */
export function getWhatsAppConfig(): WhatsAppConfig | null {
  const accessToken = clean(process.env.WHATSAPP_ACCESS_TOKEN);
  const phoneNumberId = clean(process.env.WHATSAPP_PHONE_NUMBER_ID);
  const notifyTo = clean(process.env.WHATSAPP_NOTIFY_TO);

  if (!accessToken || !phoneNumberId || !notifyTo) return null;

  const templateName = clean(process.env.WHATSAPP_TEMPLATE_NAME) || null;

  return {
    accessToken,
    phoneNumberId,
    notifyTo: notifyTo.replace(/^\+/, "").replace(/[\s-]/g, ""),
    apiVersion: clean(process.env.WHATSAPP_API_VERSION) || DEFAULT_API_VERSION,
    templateName,
    templateLang: clean(process.env.WHATSAPP_TEMPLATE_LANG) || DEFAULT_TEMPLATE_LANG,
  };
}

export function isWhatsAppConfigured(): boolean {
  return getWhatsAppConfig() !== null;
}
