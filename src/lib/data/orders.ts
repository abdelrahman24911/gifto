import { ADMIN_PAGE_SIZE } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import type {
  CreatedOrder,
  Customer,
  Order,
  OrderDetail,
  OrderSource,
  OrderStatus,
  OrderWithCustomer,
  PaymentStatus,
} from "@/lib/types";

export interface OrderListFilters {
  search?: string;
  status?: OrderStatus | "all";
  paymentStatus?: PaymentStatus | "all";
  source?: OrderSource | "all";
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}

function sanitize(term: string) {
  return term.trim().replace(/[%_,()\\]/g, " ").trim();
}

export async function listOrders(
  filters: OrderListFilters = {}
): Promise<{ items: OrderWithCustomer[]; total: number; page: number; pageCount: number }> {
  const supabase = await createClient();
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = filters.pageSize ?? ADMIN_PAGE_SIZE;

  let query = supabase
    .from("orders")
    .select("*, customer:customers(*), order_items(quantity)", { count: "exact" });

  if (filters.search) {
    const term = sanitize(filters.search);
    if (term) {
      const { data: matches } = await supabase
        .from("customers")
        .select("id")
        .or(`full_name.ilike.%${term}%,phone.ilike.%${term}%,email.ilike.%${term}%`)
        .limit(50);

      const customerIds = (matches ?? []).map((row) => row.id);
      const clauses = [`order_number.ilike.%${term}%`];
      if (customerIds.length > 0) clauses.push(`customer_id.in.(${customerIds.join(",")})`);
      query = query.or(clauses.join(","));
    }
  }

  if (filters.status && filters.status !== "all") query = query.eq("status", filters.status);
  if (filters.paymentStatus && filters.paymentStatus !== "all")
    query = query.eq("payment_status", filters.paymentStatus);
  if (filters.source && filters.source !== "all") query = query.eq("source", filters.source);
  if (filters.from) query = query.gte("created_at", filters.from);
  if (filters.to) query = query.lte("created_at", filters.to);

  const from = (page - 1) * pageSize;
  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(from, from + pageSize - 1);

  if (error) throw new Error(error.message);

  const items = (data ?? []).map((row) => {
    const { customer, order_items, ...order } = row;
    return {
      ...(order as Order),
      customer: customer as Customer | null,
      item_count: (order_items ?? []).reduce((sum, item) => sum + item.quantity, 0),
    } satisfies OrderWithCustomer;
  });

  const total = count ?? 0;
  return { items, total, page, pageCount: Math.max(1, Math.ceil(total / pageSize)) };
}

export async function getOrderDetail(
  id: string
): Promise<OrderDetail | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select(`
      *,
      customer:customers(*),
      items:order_items(*, product:products(id, name, slug, stock_quantity, is_active)),
      status_history:order_status_history(*),
      created_by_profile:profiles!orders_created_by_fkey(id, full_name, email)
    `)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  const { customer, items, status_history, created_by_profile, ...order } = data;

  return {
    ...(order as Order),
    customer: customer as Customer | null,
    items: items ?? [],
    status_history: status_history ?? [],
    created_by_profile,
  };
}

export interface CreateOrderInput {
  items: { product_id: string; quantity: number; personalization?: Record<string, string> }[];
  full_name: string;
  phone: string;
  email?: string;
  governorate: string;
  area?: string;
  delivery_address: string;
  delivery_notes?: string;
  gift_message?: string;
  source?: "website" | "instagram" | "whatsapp" | "store" | "manual";
  delivery_fee?: number;
  payment_status?: PaymentStatus;
}

export async function createOrder(
  input: CreateOrderInput
): Promise<CreatedOrder> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_order", {
    p_items: JSON.parse(JSON.stringify(input.items)),
    p_full_name: input.full_name,
    p_phone: input.phone,
    p_email: input.email ?? "",
    p_governorate: input.governorate,
    p_area: input.area ?? "",
    p_delivery_address: input.delivery_address,
    p_delivery_notes: input.delivery_notes ?? undefined,
    p_gift_message: input.gift_message ?? undefined,
    p_source: input.source ?? "website",
    p_delivery_fee: input.delivery_fee ?? 0,
    p_payment_status: input.payment_status ?? "cash_on_delivery",
  });

  if (error) throw new Error(error.message);
  return data as unknown as CreatedOrder;
}

export async function setOrderStatus(
  orderId: string,
  status: OrderStatus,
  note?: string
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_order_status", {
    p_order_id: orderId,
    p_new_status: status,
    p_note: note ?? undefined,
  });
  if (error) throw new Error(error.message);
}

export async function setPaymentStatus(
  orderId: string,
  status: PaymentStatus
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_payment_status", {
    p_order_id: orderId,
    p_new_status: status,
  });
  if (error) throw new Error(error.message);
}
