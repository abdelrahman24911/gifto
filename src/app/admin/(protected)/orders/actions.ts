"use server";

import { revalidatePath } from "next/cache";
import { ORDER_STATUSES, PAYMENT_STATUSES } from "@/lib/constants";
import { setOrderStatus, setPaymentStatus } from "@/lib/data/orders";
import { requireStaff } from "@/lib/data/auth";
import type { OrderStatus, PaymentStatus } from "@/lib/types";

export type OrderActionState = { ok?: boolean; error?: string } | null;

export async function updateOrderStatus(
  _prev: OrderActionState,
  formData: FormData,
): Promise<OrderActionState> {
  await requireStaff();

  const orderId = String(formData.get("orderId") ?? "");
  const status = String(formData.get("status") ?? "") as OrderStatus;
  const note = String(formData.get("note") ?? "");

  if (!orderId) return { error: "Missing order." };
  if (!ORDER_STATUSES.includes(status)) return { error: "Choose a valid status." };

  try {
    await setOrderStatus(orderId, status, note || undefined);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not update the order." };
  }

  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/orders");
  revalidatePath("/admin/dashboard");
  return { ok: true };
}

export async function updatePaymentStatus(
  _prev: OrderActionState,
  formData: FormData,
): Promise<OrderActionState> {
  await requireStaff();

  const orderId = String(formData.get("orderId") ?? "");
  const status = String(formData.get("status") ?? "") as PaymentStatus;

  if (!orderId) return { error: "Missing order." };
  if (!PAYMENT_STATUSES.includes(status)) return { error: "Choose a valid payment status." };

  try {
    await setPaymentStatus(orderId, status);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not update payment." };
  }

  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/orders");
  return { ok: true };
}
