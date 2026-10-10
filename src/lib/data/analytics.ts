import { createClient } from "@/lib/supabase/server";
import type { OrderStatus } from "@/lib/types";

export interface RevenuePoint {
  date: string;
  revenue: number;
  orders: number;
}

export interface StatusBreakdown {
  status: OrderStatus;
  count: number;
}

export interface TopProduct {
  name: string;
  slug: string | null;
  quantity: number;
  revenue: number;
}

export interface DashboardStats {
  revenueToday: number;
  revenueMonth: number;
  ordersToday: number;
  ordersPending: number;
  lowStockCount: number;
  outOfStockCount: number;
  newCustomersMonth: number;
  series: RevenuePoint[];
  statusBreakdown: StatusBreakdown[];
  topProducts: TopProduct[];
}

function dayKey(iso: string) {
  return iso.slice(0, 10);
}

function lastNDays(n: number): string[] {
  const days: string[] = [];
  for (let i = n - 1; i >= 0; i -= 1) {
    const date = new Date();
    date.setUTCDate(date.getUTCDate() - i);
    days.push(date.toISOString().slice(0, 10));
  }
  return days;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = await createClient();
  const now = new Date();

  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const windowStart = new Date(todayStart);
  windowStart.setUTCDate(windowStart.getUTCDate() - 29);

  const [ordersResult, stockResult, customersResult] = await Promise.all([
    supabase
      .from("orders")
      .select("id, total, status, created_at")
      .gte("created_at", windowStart.toISOString()),
    supabase.from("inventory_status").select("status"),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "customer")
      .gte("created_at", monthStart.toISOString()),
  ]);

  if (ordersResult.error) throw new Error(ordersResult.error.message);
  if (stockResult.error) throw new Error(stockResult.error.message);
  if (customersResult.error) throw new Error(customersResult.error.message);

  const orders = ordersResult.data ?? [];
  const isToday = (iso: string) => iso >= todayStart.toISOString();
  const isThisMonth = (iso: string) => iso >= monthStart.toISOString();

  const byDay = new Map<string, RevenuePoint>(
    lastNDays(30).map((date) => [date, { date, revenue: 0, orders: 0 }]),
  );
  const byStatus = new Map<OrderStatus, number>();

  let revenueToday = 0;
  let revenueMonth = 0;
  let ordersToday = 0;
  let ordersPending = 0;

  for (const order of orders) {
    const key = dayKey(order.created_at);
    const point = byDay.get(key);
    if (point && order.status !== "cancelled") {
      point.revenue += Number(order.total);
      point.orders += 1;
    }
    if (isToday(order.created_at) && order.status !== "cancelled") {
      revenueToday += Number(order.total);
      ordersToday += 1;
    }
    if (isThisMonth(order.created_at) && order.status !== "cancelled") {
      revenueMonth += Number(order.total);
    }
    byStatus.set(order.status, (byStatus.get(order.status) ?? 0) + 1);
    if (order.status === "pending") ordersPending += 1;
  }

  const stockRows = stockResult.data ?? [];
  const lowStockCount = stockRows.filter((row) => row.status === "low_stock").length;
  const outOfStockCount = stockRows.filter((row) => row.status === "out_of_stock").length;

  const topProducts = await getTopProducts();

  return {
    revenueToday,
    revenueMonth,
    ordersToday,
    ordersPending,
    lowStockCount,
    outOfStockCount,
    newCustomersMonth: customersResult.count ?? 0,
    series: [...byDay.values()],
    statusBreakdown: (["pending", "confirmed", "preparing", "shipped", "delivered", "cancelled"] as OrderStatus[])
      .map((status) => ({ status, count: byStatus.get(status) ?? 0 }))
      .filter((row) => row.count > 0),
    topProducts,
  };
}

async function getTopProducts(limit = 5): Promise<TopProduct[]> {
  const supabase = await createClient();
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - 30);

  const { data, error } = await supabase
    .from("order_items")
    .select("product_name_snapshot, slug_snapshot, quantity, unit_price, order:orders!inner(created_at, status)")
    .gte("order.created_at", since.toISOString())
    .neq("order.status", "cancelled");

  if (error) throw new Error(error.message);

  const totals = new Map<string, TopProduct & { slug: string | null }>();
  for (const row of data ?? []) {
    const key = row.product_name_snapshot;
    const entry =
      totals.get(key) ??
      { name: key, slug: row.slug_snapshot, quantity: 0, revenue: 0 };
    entry.quantity += row.quantity;
    entry.revenue += row.quantity * Number(row.unit_price);
    totals.set(key, entry);
  }

  return [...totals.values()].sort((a, b) => b.revenue - a.revenue).slice(0, limit);
}
