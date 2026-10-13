/**
 * Notification domain types shared by the formatter, provider client, worker
 * and tests. Kept free of server-only imports so they can be unit tested.
 */

/**
 * Outbox channels. `"email"` is the active channel; `"whatsapp"` is kept for a
 * future opt-in and is intentionally dormant (no jobs are created for it and no
 * WhatsApp API call is ever made).
 */
export type NotificationChannel = "email" | "whatsapp";

export interface OrderNotificationItem {
  name: string;
  quantity: number;
  unit_price: number | string | null;
}

/**
 * Authoritative snapshot persisted by `create_order`. Money is server-computed;
 * nothing here is trusted from the client at send time.
 */
export interface OrderNotificationPayload {
  order_number: string;
  customer_name: string;
  customer_phone: string;
  items: OrderNotificationItem[];
  subtotal: number | string;
  delivery_fee: number | string;
  total: number | string;
  currency?: string | null;
  payment_status?: string | null;
  governorate?: string | null;
  area?: string | null;
  delivery_address?: string | null;
  delivery_notes?: string | null;
}

/** A row claimed by `claim_notification_jobs`. */
export interface NotificationJob {
  id: string;
  order_id: string;
  channel: string;
  event_type: string;
  payload: OrderNotificationPayload;
  attempts: number;
  max_attempts: number;
}

/** Resend configuration for the active email channel. Server-only. */
export interface EmailConfig {
  apiKey: string;
  from: string;
  to: string;
}

/** Dormant WhatsApp Cloud API configuration (not used by the active worker). */
export interface WhatsAppConfig {
  accessToken: string;
  phoneNumberId: string;
  apiVersion: string;
  notifyTo: string;
  templateName: string | null;
  templateLang: string;
}

export type SendOutcome =
  | { ok: true; providerMessageId: string | null }
  | { ok: false; retryable: boolean; error: string };

export interface DispatchSummary {
  claimed: number;
  sent: number;
  failed: number;
  retried: number;
  configured: boolean;
}
