import { ADMIN_PAGE_SIZE } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import type { Customer } from "@/lib/types";

export interface CustomerListRow extends Customer {
  order_count: number;
  total_spent: number;
  last_order_at: string | null;
}

export interface CustomerFilters {
  search?: string;
  page?: number;
  pageSize?: number;
}

function sanitize(term: string) {
  return term.trim().replace(/[%_,()\\]/g, " ").trim();
}

export async function listCustomers(
  filters: CustomerFilters = {},
): Promise<{ items: CustomerListRow[]; total: number; page: number; pageCount: number }> {
  const supabase = await createClient();
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = filters.pageSize ?? ADMIN_PAGE_SIZE;

  let query = supabase
    .from("customer_stats")
    .select("*", { count: "exact" });

  if (filters.search) {
    const term = sanitize(filters.search);
    if (term) query = query.or(`full_name.ilike.%${term}%,phone.ilike.%${term}%,email.ilike.%${term}%`);
  }

  const from = (page - 1) * pageSize;
  const { data, error, count } = await query
    .order("last_order_at", { ascending: false, nullsFirst: false })
    .range(from, from + pageSize - 1);

  if (error) throw new Error(error.message);

  const total = count ?? 0;
  return {
    items: (data ?? []) as unknown as CustomerListRow[],
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export interface CustomerDetail extends CustomerListRow {
  orders: {
    id: string;
    order_number: string;
    status: string;
    payment_status: string;
    total: number;
    source: string;
    created_at: string;
  }[];
}

export async function getCustomerDetail(id: string): Promise<CustomerDetail | null> {
  const supabase = await createClient();

  const { data: customer, error } = await supabase
    .from("customer_stats")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!customer) return null;

  const { data: orders } = await supabase
    .from("orders")
    .select("id, order_number, status, payment_status, total, source, created_at")
    .eq("customer_id", id)
    .order("created_at", { ascending: false });

  return {
    ...(customer as unknown as CustomerListRow),
    orders: orders ?? [],
  };
}
