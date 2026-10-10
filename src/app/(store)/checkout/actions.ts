"use server";

import { checkoutSchema } from "@/lib/checkout";
import { createOrder } from "@/lib/data/orders";
import { getCheckoutLines } from "@/lib/data/products";
import { FREE_DELIVERY_THRESHOLD } from "@/lib/constants";

export type PlaceOrderInput = {
  items: { product_id: string; quantity: number; personalization?: Record<string, string> }[];
  full_name: string;
  phone: string;
  email?: string;
  governorate: string;
  area?: string;
  delivery_address: string;
  delivery_notes?: string;
  gift_message?: string;
  payment_method: "cash_on_delivery" | "card";
};

export type PlaceOrderResult =
  | {
      ok: true;
      order: { id: string; order_number: string; subtotal: number; delivery_fee: number; total: number };
    }
  | { ok: false; error: string };

export async function placeOrder(input: PlaceOrderInput): Promise<PlaceOrderResult> {
  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: first?.message ?? "Please check your details." };
  }

  const {
    items,
    governorate,
    payment_method,
    full_name,
    phone,
    email,
    area,
    delivery_address,
    delivery_notes,
    gift_message,
  } = parsed.data;

  const productIds = [...new Set(items.map((item) => item.product_id))];
  const snapshot = await getCheckoutLines(productIds);

  for (const item of items) {
    const product = snapshot[item.product_id];
    if (!product) return { ok: false, error: "One of your items is no longer available." };
    if (!product.is_active)
      return { ok: false, error: `${product.name} is no longer available.` };
    if (item.quantity > product.stock_quantity)
      return {
        ok: false,
        error: `Only ${product.stock_quantity} in stock for “${product.name}”.`,
      };
  }

  // Delivery fee and payment status are derived server-side inside the
  // `create_order` RPC (P0 §10.1 #2) — the app sends the payment method only.
  try {
    const order = await createOrder({
      items,
      full_name,
      phone,
      email: email || undefined,
      governorate,
      area: area || undefined,
      delivery_address,
      delivery_notes: delivery_notes || undefined,
      gift_message: gift_message || undefined,
      source: "website",
      payment_method,
    });
    return { ok: true, order };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? cleanOrderError(error.message) : "Could not place your order.",
    };
  }
}

function cleanOrderError(message: string): string {
  const friendly: Record<string, string> = {
    "Your cart is empty.": "Your cart is empty.",
    "Please enter the recipient full name.": "Please enter your full name.",
    "Please enter a valid phone number.": "Please enter a valid phone number.",
    "Please choose a governorate.": "Please choose a governorate.",
    "Please enter a delivery address.": "Please enter a delivery address.",
  };
  const generic = "That item is not available right now.";
  return friendly[message] ?? generic;
}

/** Convenience so the client can show the free-delivery hint consistently. */
export const FREE_SHIPPING_AT = FREE_DELIVERY_THRESHOLD;