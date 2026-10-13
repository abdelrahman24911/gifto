import { getEmailConfig } from "./config";
import { buildEmailHtml, buildEmailSubject, buildEmailText } from "./format";
import type { EmailConfig, OrderNotificationPayload, SendOutcome } from "./types";

const RESEND_ENDPOINT = "https://api.resend.com/emails";
const DEFAULT_TIMEOUT_MS = 10_000;

export interface SendEmailDeps {
  fetchImpl?: typeof fetch;
  /** `undefined` reads the environment; pass explicitly (incl. null) in tests. */
  config?: EmailConfig | null;
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

/**
 * Sends one order notification to the store owner through Resend.
 *
 * Guarantees:
 *   - Never throws: a failed email can never affect an already-persisted order.
 *   - Never leaks the API key: only the provider's own error `message` is
 *     surfaced, and no request headers or payloads are logged.
 *   - Ambiguous failures (network, timeout) are retryable; deterministic 4xx
 *     rejections (bad sender/recipient/key) are permanent.
 */
export async function sendOrderEmail(
  payload: OrderNotificationPayload,
  deps: SendEmailDeps = {},
): Promise<SendOutcome> {
  const config = deps.config === undefined ? getEmailConfig() : deps.config;
  if (!config) {
    return { ok: false, retryable: false, error: "Email notifications are not configured." };
  }

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
