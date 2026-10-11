import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/* -------------------------------------------------------------------------- */
/* formatting                                                                  */
/* -------------------------------------------------------------------------- */

const egpFormatter = new Intl.NumberFormat("en-EG", {
  style: "decimal",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/** Formats an amount as Egyptian pounds: 450 → "450 EGP" */
export function formatEGP(amount: number | string | null | undefined): string {
  const value = Number(amount ?? 0);
  if (Number.isNaN(value)) return "0 EGP";
  return `${egpFormatter.format(value)} EGP`;
}

export function formatNumber(value: number | string | null | undefined): string {
  const n = Number(value ?? 0);
  return Number.isNaN(n) ? "0" : egpFormatter.format(n);
}

/**
 * The store is Egypt-based, so every timestamp is displayed in Cairo time
 * regardless of where the page is rendered (Vercel servers run in UTC) or
 * which timezone the visitor is in.
 */
export const APP_TIME_ZONE = "Africa/Cairo";

const dateFormatter = new Intl.DateTimeFormat("en-EG", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: APP_TIME_ZONE,
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-EG", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: APP_TIME_ZONE,
});

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return dateFormatter.format(date);
}

export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return dateTimeFormatter.format(date);
}

export function formatRelativeTime(
  value: string | Date | null | undefined,
  now: Date,
): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  const target = now;
  const diffMs = date.getTime() - target.getTime();
  const abs = Math.abs(diffMs);
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  const minutes = Math.round(abs / 60000);
  if (minutes < 1) return rtf.format(Math.round(diffMs / 1000), "second");
  if (minutes < 60) return rtf.format(diffMs / 60000, "minute");
  const hours = Math.round(abs / 3600000);
  if (hours < 24) return rtf.format(diffMs / 3600000, "hour");
  const days = Math.round(abs / 86400000);
  if (days < 30) return rtf.format(diffMs / 86400000, "day");
  return formatDate(date);
}

/* -------------------------------------------------------------------------- */
/* text                                                                        */
/* -------------------------------------------------------------------------- */

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
}

export function truncate(input: string, max = 90): string {
  if (input.length <= max) return input;
  return `${input.slice(0, max).trimEnd()}…`;
}

export function titleCase(input: string): string {
  return input
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/* -------------------------------------------------------------------------- */
/* misc                                                                        */
/* -------------------------------------------------------------------------- */

export function uniqueBy<T, K>(items: T[], key: (item: T) => K): T[] {
  const seen = new Set<K>();
  return items.filter((item) => {
    const k = key(item);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

export function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}
