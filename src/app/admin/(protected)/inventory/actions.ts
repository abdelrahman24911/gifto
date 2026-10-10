"use server";

import { revalidatePath } from "next/cache";
import { adjustStock, restock } from "@/lib/data/inventory";
import { requireStaff } from "@/lib/data/auth";

export type StockState = { ok?: boolean; error?: string } | null;

function revalidate() {
  revalidatePath("/admin/inventory");
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/products");
}

export async function restockProduct(_prev: StockState, formData: FormData): Promise<StockState> {
  await requireStaff();
  const productId = String(formData.get("productId") ?? "");
  const quantity = Number.parseInt(String(formData.get("quantity") ?? ""), 10);
  const note = String(formData.get("note") ?? "").trim();

  if (!productId) return { error: "Missing product." };
  if (!Number.isFinite(quantity) || quantity < 1) return { error: "Enter a quantity of at least 1." };

  try {
    await restock(productId, quantity, note || undefined);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not restock." };
  }

  revalidate();
  return { ok: true };
}

export async function setStockLevel(_prev: StockState, formData: FormData): Promise<StockState> {
  await requireStaff();
  const productId = String(formData.get("productId") ?? "");
  const newStock = Number.parseInt(String(formData.get("newStock") ?? ""), 10);
  const reason = String(formData.get("reason") ?? "").trim();

  if (!productId) return { error: "Missing product." };
  if (!Number.isFinite(newStock) || newStock < 0) return { error: "Enter a valid stock count." };
  if (reason.length < 3) return { error: "A reason is required (at least 3 characters)." };

  try {
    await adjustStock(productId, newStock, reason);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not adjust stock." };
  }

  revalidate();
  return { ok: true };
}
