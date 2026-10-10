import { ADMIN_PAGE_SIZE } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import type { InventoryItem, InventoryStatusRow, MovementType } from "@/lib/types";

export interface InventoryFilters {
  search?: string;
  status?: "all" | "healthy" | "low_stock" | "out_of_stock";
  page?: number;
  pageSize?: number;
}

function sanitize(term: string) {
  return term.trim().replace(/[%_,()\\]/g, " ").trim();
}

export async function listInventory(
  filters: InventoryFilters = {},
): Promise<{ items: InventoryItem[]; total: number; page: number; pageCount: number }> {
  const supabase = await createClient();
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = filters.pageSize ?? ADMIN_PAGE_SIZE;

  let query = supabase
    .from("inventory_status")
    .select("*", { count: "exact" });

  if (filters.search) {
    const term = sanitize(filters.search);
    if (term) query = query.or(`name.ilike.%${term}%,sku.ilike.%${term}%`);
  }
  if (filters.status && filters.status !== "all") query = query.eq("status", filters.status);

  const from = (page - 1) * pageSize;
  const { data, error, count } = await query
    .order("stock_quantity", { ascending: true })
    .range(from, from + pageSize - 1);

  if (error) throw new Error(error.message);

  const rows = (data ?? []) as InventoryStatusRow[];
  const productIds = rows.map((row) => row.product_id).filter((id): id is string => Boolean(id));

  const counts = new Map<string, { count: number; last: string | null }>();
  if (productIds.length > 0) {
    const { data: movements } = await supabase
      .from("inventory_movements")
      .select("product_id, created_at")
      .in("product_id", productIds)
      .order("created_at", { ascending: false });

    for (const movement of movements ?? []) {
      const entry = counts.get(movement.product_id) ?? { count: 0, last: null };
      entry.count += 1;
      if (!entry.last) entry.last = movement.created_at;
      counts.set(movement.product_id, entry);
    }
  }

  const items = rows.map((row) => {
    const stats = row.product_id ? counts.get(row.product_id) : undefined;
    return {
      ...row,
      movement_count: stats?.count ?? 0,
      last_movement_at: stats?.last ?? null,
    } satisfies InventoryItem;
  });

  const total = count ?? 0;
  return { items, total, page, pageCount: Math.max(1, Math.ceil(total / pageSize)) };
}

export interface MovementFilters {
  productId?: string;
  type?: MovementType | "all";
  page?: number;
  pageSize?: number;
}

export async function listMovements(filters: MovementFilters = {}) {
  const supabase = await createClient();
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = filters.pageSize ?? ADMIN_PAGE_SIZE;

  let query = supabase
    .from("inventory_movements")
    .select("*, product:products(id, name, slug), actor:profiles!inventory_movements_created_by_fkey(full_name, email)", {
      count: "exact",
    });

  if (filters.productId) query = query.eq("product_id", filters.productId);
  if (filters.type && filters.type !== "all") query = query.eq("type", filters.type);

  const from = (page - 1) * pageSize;
  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(from, from + pageSize - 1);

  if (error) throw new Error(error.message);

  const total = count ?? 0;
  return {
    items: data ?? [],
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function adjustStock(productId: string, newStock: number, reason: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("adjust_stock", {
    p_product_id: productId,
    p_new_stock: newStock,
    p_reason: reason,
  });
  if (error) throw new Error(error.message);
}

export async function restock(productId: string, quantity: number, note?: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("restock", {
    p_product_id: productId,
    p_quantity: quantity,
    p_note: note ?? undefined,
  });
  if (error) throw new Error(error.message);
}
