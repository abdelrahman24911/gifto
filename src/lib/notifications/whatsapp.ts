import { getWhatsAppConfig } from "./config";
import { buildTemplateParameters, buildTextMessage } from "./format";
import type { OrderNotificationPayload, SendOutcome, WhatsAppConfig } from "./types";

const GRAPH_BASE = "https://graph.facebook.com";
const DEFAULT_TIMEOUT_MS = 10_000;

export interface SendDeps {
  fetchImpl?: typeof fetch;
  /** `undefined` reads the environment; pass explicitly (incl. null) in tests. */
  config?: WhatsAppConfig | null;
  timeoutMs?: number;
}

interface GraphMessageResponse {
  messages?: { id?: string }[];
  error?: { message?: string; code?: number };
}

function templateBody(config: WhatsAppConfig, payload: OrderNotificationPayload) {
  const parameters = buildTemplateParameters(payload).map((text) => ({ type: "text", text }));
  return {
    messaging_product: "whatsapp",
    to: config.notifyTo,
    type: "template",
    template: {
      name: config.templateName,
      language: { code: config.templateLang },
      components: [{ type: "body", parameters }],
    },
  };
}

function textBody(config: WhatsAppConfig, payload: OrderNotificationPayload) {
  return {
    messaging_product: "whatsapp",
    to: config.notifyTo,
    type: "text",
    text: { preview_url: false, body: buildTextMessage(payload) },
  };
}

function isRetryableStatus(status: number): boolean {
  return status === 408 || status === 429 || status >= 500;
}

function describeError(error: unknown): string {
  if (error instanceof Error) {
    if (error.name === "AbortError") return "WhatsApp request timed out.";
    return error.message || "WhatsApp request failed.";
  }
  return "WhatsApp request failed.";
}

async function safeJson(response: Response): Promise<GraphMessageResponse | null> {
  try {
    return (await response.json()) as GraphMessageResponse;
  } catch {
    return null;
  }
}

/**
 * Sends one order notification through the WhatsApp Business Platform Cloud API.
 *
 * Uses an approved template when configured (required for business-initiated
 * messages), otherwise a plain text message (only valid inside the 24-hour
 * customer service window). Never throws and never returns the access token.
 */
export async function sendOrderNotification(
  payload: OrderNotificationPayload,
  deps: SendDeps = {},
): Promise<SendOutcome> {
  const config = deps.config === undefined ? getWhatsAppConfig() : deps.config;
  if (!config) {
    return { ok: false, retryable: false, error: "WhatsApp notifications are not configured." };
  }

  const fetchImpl = deps.fetchImpl ?? fetch;
  const body = config.templateName ? templateBody(config, payload) : textBody(config, payload);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), deps.timeoutMs ?? DEFAULT_TIMEOUT_MS);

  try {
    const response = await fetchImpl(
      `${GRAPH_BASE}/${config.apiVersion}/${config.phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      },
    );

    const json = await safeJson(response);

    if (!response.ok) {
      return {
        ok: false,
        retryable: isRetryableStatus(response.status),
        error: json?.error?.message ?? `WhatsApp API returned HTTP ${response.status}.`,
      };
    }

    const id = json?.messages?.[0]?.id;
    return { ok: true, providerMessageId: typeof id === "string" ? id : null };
  } catch (error) {
    // Network failure or timeout: delivery is ambiguous, so retry is safe.
    return { ok: false, retryable: true, error: describeError(error) };
  } finally {
    clearTimeout(timeout);
  }
}
