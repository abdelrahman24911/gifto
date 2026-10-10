"use server";

import { trackOrder, type TrackedOrder } from "@/lib/data/track";

export type TrackLookupState =
  | { kind: "idle" }
  | { kind: "empty"; error: string }
  | { kind: "not-found" }
  | { kind: "error"; error: string }
  | { kind: "ok"; order: TrackedOrder };

export async function lookupTrackedOrder(
  _prev: TrackLookupState,
  formData: FormData,
): Promise<TrackLookupState> {
  const orderNumber = String(formData.get("order_number") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();

  if (!orderNumber || !phone) {
    return { kind: "empty", error: "Enter both your order number and phone number." };
  }

  try {
    const order = await trackOrder(orderNumber, phone);
    return order ? { kind: "ok", order } : { kind: "not-found" };
  } catch {
    return {
      kind: "error",
      error: "We couldn't look up your order right now. Please try again in a moment.",
    };
  }
}