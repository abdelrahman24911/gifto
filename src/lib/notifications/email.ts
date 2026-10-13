import { getEmailConfig, getGmailConfig } from "./config";
import { buildEmailHtml, buildEmailSubject, buildEmailText } from "./format";
import type {
  EmailConfig,
  GmailConfig,
  MailTransport,
  OrderNotificationPayload,
  SendOutcome,
} from "./types";

const RESEND_ENDPOINT = "https://api.resend.com/emails";
const DEFAULT_TIMEOUT_MS = 10_000;

export interface SendEmailDeps {
  fetchImpl?: typeof fetch;
  /** `undefined` reads the environment; pass explicitly (incl. null) in tests. */
  config?: EmailConfig | null;
  /** Gmail SMTP config; `undefined` reads the environment, `null` disables it. */
  gmailConfig?: GmailConfig | null;
  /** Injected SMTP transport (tests). `undefined` builds a real Gmail transport. */
  transporter?: MailTransport;
  timeoutMs?: number;
}

interface ResendResponse {
  id?: string;
  message?: string;
  name?: string;
  error?: { message?: string };
}

function isRetryableStatus(status: number): boolean {
  return status === 408 || status === 429 || status >= 500;
}

/**
 * SMTP failures are split into deterministic rejections (bad credentials or a
 * rejected envelope — never retry) and transport/transient failures (retry).
 */
function isRetryableSmtpError(error: unknown): boolean {
  const err = error as { code?: string; responseCode?: number } | null;
  if (err?.code === "EAUTH" || err?.code === "EENVELOPE") return false;
  if (typeof err?.responseCode === "number") {
    return err.responseCode >= 400 && err.responseCode < 500;
  }
  return true;
}

function describeError(error: unknown): string {
  if (error instanceof Error) {
    if (error.name === "AbortError") return "Email request timed out.";
    return error.message || "Email request failed.";
  }
  return "Email request failed.";
}

async function safeJson(response: Response): Promise<ResendResponse | null> {
  try {
    return (await response.json()) as ResendResponse;
  } catch {
    return null;
  }
}

/** Builds a real Gmail SMTP transport. Imported lazily so it stays server-only. */
async function buildGmailTransport(
  config: GmailConfig,
  timeoutMs: number,
): Promise<MailTransport> {
  const mod = (await import("nodemailer")) as unknown as {
    default?: { createTransport: (options: unknown) => MailTransport };
    createTransport?: (options: unknown) => MailTransport;
  };
  const nodemailer = mod.default ?? mod;
  return nodemailer.createTransport!({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user: config.user, pass: config.pass },
    connectionTimeout: timeoutMs,
    greetingTimeout: timeoutMs,
    socketTimeout: timeoutMs,
  });
}

async function sendViaGmail(
  payload: OrderNotificationPayload,
  config: GmailConfig,
  deps: SendEmailDeps,
): Promise<SendOutcome> {
  try {
    const transporter =
      deps.transporter ?? (await buildGmailTransport(config, deps.timeoutMs ?? DEFAULT_TIMEOUT_MS));

    const info = await transporter.sendMail({
      from: config.from,
      to: config.to,
      subject: buildEmailSubject(payload),
      text: buildEmailText(payload),
      html: buildEmailHtml(payload),
    });

    return { ok: true, providerMessageId: typeof info?.messageId === "string" ? info.messageId : null };
  } catch (error) {
    return { ok: false, retryable: isRetryableSmtpError(error), error: describeError(error) };
  }
}

async function sendViaResend(
  payload: OrderNotificationPayload,
  config: EmailConfig,
  deps: SendEmailDeps,
): Promise<SendOutcome> {
  const fetchImpl = deps.fetchImpl ?? fetch;
  const body = {
    from: config.from,
    to: config.to,
    subject: buildEmailSubject(payload),
    text: buildEmailText(payload),
    html: buildEmailHtml(payload),
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), deps.timeoutMs ?? DEFAULT_TIMEOUT_MS);

  try {
    const response = await fetchImpl(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    const json = await safeJson(response);

    if (!response.ok) {
      return {
        ok: false,
        retryable: isRetryableStatus(response.status),
        error:
          json?.message ??
          json?.error?.message ??
          `Email provider returned HTTP ${response.status}.`,
      };
    }

    return { ok: true, providerMessageId: typeof json?.id === "string" ? json.id : null };
  } catch (error) {
    // Network failure or timeout: delivery is ambiguous, so retry is safe.
    return { ok: false, retryable: true, error: describeError(error) };
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Sends one order notification to the store owner.
 *
 * Transport selection: Gmail SMTP is preferred when configured, otherwise the
 * Resend HTTP API is used. Guarantees:
 *   - Never throws: a failed email can never affect an already-persisted order.
 *   - Never leaks secrets: only the provider's own error `message` is surfaced,
 *     and no request headers, credentials or payloads are logged.
 *   - Ambiguous failures (network, timeout) are retryable; deterministic
 *     rejections (bad sender/recipient/credentials) are permanent.
 */
export async function sendOrderEmail(
  payload: OrderNotificationPayload,
  deps: SendEmailDeps = {},
): Promise<SendOutcome> {
  const gmailConfig = deps.gmailConfig === undefined ? getGmailConfig() : deps.gmailConfig;
  if (gmailConfig) return sendViaGmail(payload, gmailConfig, deps);

  const config = deps.config === undefined ? getEmailConfig() : deps.config;
  if (!config) {
    return { ok: false, retryable: false, error: "Email notifications are not configured." };
  }

  return sendViaResend(payload, config, deps);
}
