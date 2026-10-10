import type { OrderStatus } from "@/lib/types";

/** Builds a query string, dropping empty/default values. */
export function adminQuery(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === "" || value === null) continue;
    search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `?${query}` : "";
}

export function orderStatusHref(status: OrderStatus | "all", extras: Record<string, string | number | undefined> = {}): string {
  return `/admin/orders${adminQuery({ ...extras, status: status === "all" ? "" : status })}`;
}

export function first(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export function toPage(value: string | string[] | undefined): number {
  const parsed = Number.parseInt(first(value), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}
