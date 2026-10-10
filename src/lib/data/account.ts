import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/data/auth";
import type { Customer, Order } from "@/lib/types";

export interface AccountSummary {
  customer: Customer;
  orders: (Order & { item_count: number })[];
}

/**
 * The signed-in user + their linked customer row and recent orders.
 * RLS restricts every read here to the caller's own rows only.
 */
export const getCustomerAccount = cache(async (): Promise<AccountSummary | null> => {
  const user = await getSession();
  if (!user) return null;

  const supabase = await createClient();

  const { data: customerData } = await supabase
    .from("customers")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!customerData) return null;
  const customer = customerData as Customer;

  const { data: ordersData, error } = await supabase
    .from("orders")
    .select("*, order_items(quantity)")
    .eq("customer_id", customer.id)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) throw new Error(error.message);

  const orders = (ordersData ?? []).map((row) => {
    const { order_items, ...order } = row;
    return {
      ...(order as Order),
      item_count: (order_items ?? []).reduce((sum, item) => sum + item.quantity, 0),
    };
  });

  return { customer, orders };
});

export async function requireCustomerAccount(): Promise<AccountSummary> {
  const account = await getCustomerAccount();
  if (!account) redirect("/login");
  return account;
}