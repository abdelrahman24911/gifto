import { z } from "zod";
import {
  DEFAULT_DELIVERY_FEE,
  FREE_DELIVERY_THRESHOLD,
  GOVERNORATES,
} from "@/lib/constants";

export const ORDER_SOURCES = [
  "website",
  "instagram",
  "whatsapp",
  "store",
  "manual",
] as const;

export const checkoutSchema = z.object({
  items: z
    .array(
      z.object({
        product_id: z.string().uuid(),
        quantity: z.number().int().min(1).max(50),
        personalization: z.record(z.string(), z.string().max(200)).optional(),
      }),
    )
    .min(1, "Your cart is empty."),
  full_name: z.string().trim().min(2, "Enter your full name.").max(120),
  phone: z
    .string()
    .trim()
    .min(8, "Enter a valid phone number.")
    .max(20)
    .regex(/^[0-9+\s\-()]+$/, "Use digits only (+ optional)."),
  email: z
    .union([z.literal(""), z.string().trim().email("Enter a valid email.").max(200)])
    .optional(),
  governorate: z.string().trim().min(1, "Choose a governorate.").max(60),
  area: z.string().trim().max(120).optional(),
  delivery_address: z
    .string()
    .trim()
    .min(5, "Enter the street address.").max(300),
  delivery_notes: z.string().trim().max(500).optional(),
  gift_message: z.string().trim().max(500).optional(),
  payment_method: z.enum(["cash_on_delivery", "card"], {
    message: "Choose how you would like to pay.",
  }),
  source: z.enum(ORDER_SOURCES).default("website"),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type CheckoutItems = CheckoutInput["items"];

/** Delivery fee for one item order — free above the threshold. */
export function deliveryFeeFor(governorate: string, subtotal: number): number {
  if (subtotal >= FREE_DELIVERY_THRESHOLD) return 0;
  const match = GOVERNORATES.find((row) => row.slug === governorate);
  return match?.fee ?? DEFAULT_DELIVERY_FEE;
}

export function governorateFee(governorate: string): number {
  const match = GOVERNORATES.find((row) => row.slug === governorate);
  return match?.fee ?? DEFAULT_DELIVERY_FEE;
}

export function shippingProgress(subtotal: number): number {
  if (subtotal >= FREE_DELIVERY_THRESHOLD) return 100;
  return Math.min(100, Math.round((subtotal / FREE_DELIVERY_THRESHOLD) * 100));
}

export function paymentStatusFor(method: "cash_on_delivery" | "card") {
  if (method === "card") {
    return { payment_status: "pending", label: "Pay by card" } as const;
  }
  return { payment_status: "cash_on_delivery", label: "Cash on delivery" } as const;
}