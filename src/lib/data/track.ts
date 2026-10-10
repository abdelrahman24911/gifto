import { createPublicClient } from "@/lib/supabase/public";

export interface TrackedItem {
  name: string;
  quantity: number;
  unit_price: number;
}

export interface TrackedOrder {
  order_number: string;
  status: string;
  payment_status: string;
  total: number;
  governorate: string;
  created_at: string;
  items: TrackedItem[];
}

/**
 * Guest order lookup. Requires order number AND the phone used at checkout —
 * both are checked inside the Postgres function, so RLS is never the only wall.
 */
export async function trackOrder(
  orderNumber: string,
  phone: string,
): Promise<TrackedOrder | null> {
  const supabase = createPublicClient();
  const { data, error } = await supabase.rpc("get_order_status", {
    p_order_number: orderNumber.trim(),
    p_phone: phone.trim(),
  });

  if (error) throw new Error(error.message);
  if (!data) return null;

  const payload = data as unknown as TrackedOrder;
  return { ...payload, items: payload.items ?? [] };
}
