import type { OrderNotificationItem, OrderNotificationPayload } from "./types";

const EMPTY = "—";

const currencyFormatter = new Intl.NumberFormat("en-EG", {
  maximumFractionDigits: 2,
  minimumFractionDigits: 0,
});

/** Formats a server-computed amount with its currency, e.g. 1250 -> "1,250 EGP". */
export function formatMoney(
  amount: number | string | null | undefined,
  currency = "EGP",
): string {
  const value = Number(amount ?? 0);
  const safe = Number.isFinite(value) ? value : 0;
  return `${currencyFormatter.format(safe)} ${currency}`;
}

/** "2× Birthday Bliss Box, 1× Custom Mug" */
export function formatOrderItems(items: OrderNotificationItem[] | null | undefined): string {
  if (!items || items.length === 0) return EMPTY;
  const parts = items
    .filter((item) => item && item.name)
    .map((item) => `${item.quantity ?? 1}× ${String(item.name).trim()}`);
  return parts.length > 0 ? parts.join(", ") : EMPTY;
}

/** "Building 5, Nasr City, cairo" — address, area then governorate. */
export function formatDeliveryLocation(payload: OrderNotificationPayload): string {
  const parts = [payload.delivery_address, payload.area, payload.governorate]
    .map((part) => (part == null ? "" : String(part).trim()))
    .filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : EMPTY;
}

function nonEmpty(value: unknown, fallback = EMPTY): string {
  if (value == null) return fallback;
  const text = String(value).trim();
  return text.length > 0 ? text : fallback;
}

/**
 * WhatsApp template parameters cannot contain newlines, tabs or runs of
 * whitespace, so template values are collapsed to a single line.
 */
function sanitizeParam(value: string): string {
  const collapsed = value.replace(/\s+/g, " ").trim();
  return collapsed.length > 0 ? collapsed : EMPTY;
}

/**
 * Ordered body parameters for the approved WhatsApp template.
 *
 * Template author (create with matching order):
 *   1 {{1}} order number
 *   2 {{2}} customer name
 *   3 {{3}} customer phone
 *   4 {{4}} items ("2× Name, 1× Name")
 *   5 {{5}} total with currency
 *   6 {{6}} delivery address / area / governorate
 *   7 {{7}} delivery notes
 */
export function buildTemplateParameters(payload: OrderNotificationPayload): string[] {
  return [
    nonEmpty(payload.order_number),
    nonEmpty(payload.customer_name),
    nonEmpty(payload.customer_phone),
    formatOrderItems(payload.items),
    formatMoney(payload.total, nonEmpty(payload.currency, "EGP")),
    formatDeliveryLocation(payload),
    nonEmpty(payload.delivery_notes, "None"),
  ].map(sanitizeParam);
}

/** Plain-text body, used only inside the 24-hour customer service window. */
export function buildTextMessage(payload: OrderNotificationPayload): string {
  const lines = [
    `New order ${nonEmpty(payload.order_number)}`,
    `Customer: ${nonEmpty(payload.customer_name)} (${nonEmpty(payload.customer_phone)})`,
    `Items: ${formatOrderItems(payload.items)}`,
    `Total: ${formatMoney(payload.total, nonEmpty(payload.currency, "EGP"))}`,
    `Deliver to: ${formatDeliveryLocation(payload)}`,
  ];
  const notes = nonEmpty(payload.delivery_notes, "");
  if (notes) lines.push(`Notes: ${notes}`);
  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Email channel (active)
// ---------------------------------------------------------------------------

/** One human-readable line per item, e.g. "2× Birthday Bliss Box — 200 EGP each". */
export function formatItemLines(items: OrderNotificationItem[] | null | undefined): string[] {
  if (!items || items.length === 0) return [];
  return items
    .filter((item) => item && item.name)
    .map((item) => {
      const name = String(item.name).trim();
      const quantity = item.quantity ?? 1;
      const price = item.unit_price;
      const hasPrice = price !== null && price !== undefined && price !== "";
      const suffix = hasPrice ? ` — ${formatMoney(price)} each` : "";
      return `${quantity}× ${name}${suffix}`;
    });
}

function currencyOf(payload: OrderNotificationPayload): string {
  return nonEmpty(payload.currency, "EGP");
}

export function buildEmailSubject(payload: OrderNotificationPayload): string {
  return `New order ${nonEmpty(payload.order_number)} - ${formatMoney(payload.total, currencyOf(payload))}`;
}

/**
 * Plain-text email body. Built only from the authoritative order payload
 * persisted by `create_order` (server-computed totals, item snapshots).
 */
export function buildEmailText(payload: OrderNotificationPayload): string {
  const currency = currencyOf(payload);
  const itemLines = formatItemLines(payload.items);
  const lines = [
    `New order ${nonEmpty(payload.order_number)}`,
    "",
    "Customer",
    `  Name:  ${nonEmpty(payload.customer_name)}`,
    `  Phone: ${nonEmpty(payload.customer_phone)}`,
    "",
    "Items",
    ...(itemLines.length > 0 ? itemLines.map((line) => `  ${line}`) : [`  ${EMPTY}`]),
    "",
    "Totals",
    `  Subtotal:      ${formatMoney(payload.subtotal, currency)}`,
    `  Delivery fee:  ${formatMoney(payload.delivery_fee, currency)}`,
    `  Total:         ${formatMoney(payload.total, currency)}`,
    "",
    "Delivery details",
    `  Address:     ${nonEmpty(payload.delivery_address)}`,
    `  Area:        ${nonEmpty(payload.area)}`,
    `  Governorate: ${nonEmpty(payload.governorate)}`,
    `  Notes:       ${nonEmpty(payload.delivery_notes, "None")}`,
  ];
  if (payload.payment_status) lines.push("", `Payment status: ${payload.payment_status}`);
  return lines.join("\n");
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** HTML email body mirroring `buildEmailText`, with values HTML-escaped. */
export function buildEmailHtml(payload: OrderNotificationPayload): string {
  const currency = currencyOf(payload);
  const itemLines = formatItemLines(payload.items);
  const itemsHtml =
    itemLines.length > 0
      ? `<ul>${itemLines.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}</ul>`
      : `<p>${EMPTY}</p>`;

  const paymentRow = payload.payment_status
    ? `<tr><td>Payment status</td><td>${escapeHtml(payload.payment_status)}</td></tr>`
    : "";

  return [
    `<h2>New order ${escapeHtml(nonEmpty(payload.order_number))}</h2>`,
    `<h3>Customer</h3>`,
    `<p>${escapeHtml(nonEmpty(payload.customer_name))}<br>${escapeHtml(nonEmpty(payload.customer_phone))}</p>`,
    `<h3>Items</h3>`,
    itemsHtml,
    `<h3>Totals</h3>`,
    `<table cellpadding="4">`,
    `<tr><td>Subtotal</td><td>${escapeHtml(formatMoney(payload.subtotal, currency))}</td></tr>`,
    `<tr><td>Delivery fee</td><td>${escapeHtml(formatMoney(payload.delivery_fee, currency))}</td></tr>`,
    `<tr><td><strong>Total</strong></td><td><strong>${escapeHtml(formatMoney(payload.total, currency))}</strong></td></tr>`,
    paymentRow,
    `</table>`,
    `<h3>Delivery details</h3>`,
    `<p>Address: ${escapeHtml(nonEmpty(payload.delivery_address))}<br>Area: ${escapeHtml(nonEmpty(payload.area))}<br>Governorate: ${escapeHtml(nonEmpty(payload.governorate))}<br>Notes: ${escapeHtml(nonEmpty(payload.delivery_notes, "None"))}</p>`,
  ].join("\n");
}
