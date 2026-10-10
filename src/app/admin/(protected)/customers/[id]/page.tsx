export const instant = false;

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Mail, Phone, ShoppingBag } from "lucide-react";
import { getCustomerDetail } from "@/lib/data/customers";
import { formatDate, formatDateTime, formatEGP, formatNumber } from "@/lib/utils";
import { AdminPageHeader } from "@/components/admin/admin-shell";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/admin/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import type { OrderStatus, PaymentStatus } from "@/lib/types";

export const metadata: Metadata = { title: "Customer" };

export default async function AdminCustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const customer = await getCustomerDetail(id);
  if (!customer) notFound();

  return (
    <>
      <Link
        href="/admin/customers"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-primary"
      >
        <ArrowLeft className="size-4" aria-hidden />
        All customers
      </Link>

      <AdminPageHeader
        title={customer.full_name ?? "Customer"}
        description={`Customer since ${formatDate(customer.created_at)}`}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-card border border-border bg-surface p-5 shadow-hairline">
          <p className="text-xs font-bold uppercase tracking-[0.07em] text-muted-foreground">Orders</p>
          <p className="mt-1 text-2xl font-extrabold">{formatNumber(customer.order_count ?? 0)}</p>
        </div>
        <div className="rounded-card border border-border bg-surface p-5 shadow-hairline">
          <p className="text-xs font-bold uppercase tracking-[0.07em] text-muted-foreground">Total spent</p>
          <p className="mt-1 text-2xl font-extrabold">{formatEGP(customer.total_spent ?? 0)}</p>
        </div>
        <div className="rounded-card border border-border bg-surface p-5 shadow-hairline">
          <p className="text-xs font-bold uppercase tracking-[0.07em] text-muted-foreground">Last order</p>
          <p className="mt-1 text-2xl font-extrabold">{formatDate(customer.last_order_at)}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.6fr]">
        <section className="rounded-card border border-border bg-surface p-5 shadow-hairline sm:p-6">
          <h2 className="mb-4 text-base font-bold tracking-tight">Contact</h2>
          <dl className="space-y-3 text-sm">
            {customer.phone ? (
              <div className="flex items-center gap-2">
                <Phone className="size-4 text-muted-foreground" aria-hidden />
                <a href={`tel:${customer.phone}`} className="hover:text-primary">
                  {customer.phone}
                </a>
              </div>
            ) : null}
            {customer.email ? (
              <div className="flex items-center gap-2">
                <Mail className="size-4 text-muted-foreground" aria-hidden />
                <a href={`mailto:${customer.email}`} className="break-all hover:text-primary">
                  {customer.email}
                </a>
              </div>
            ) : null}
            {!customer.phone && !customer.email ? (
              <p className="text-muted-foreground">No contact details on file.</p>
            ) : null}
          </dl>
        </section>

        <section className="overflow-hidden rounded-card border border-border bg-surface shadow-hairline">
          <h2 className="border-b border-border px-5 py-4 text-base font-bold tracking-tight sm:px-6">
            Orders
          </h2>
          {customer.orders.length === 0 ? (
            <div className="p-5 sm:p-6">
              <EmptyState
                compact
                icon={<ShoppingBag className="size-6" aria-hidden />}
                title="No orders yet"
                description="This customer has not placed an order."
              />
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {customer.orders.map((order) => (
                <li key={order.id}>
                  <Link
                    href={`/admin/orders/${order.id}`}
                    className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-surface-muted/50 sm:px-6"
                  >
                    <div>
                      <p className="font-bold text-foreground">{order.order_number}</p>
                      <p className="text-xs text-muted-foreground">{formatDateTime(order.created_at)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <OrderStatusBadge status={order.status as OrderStatus} />
                      <PaymentStatusBadge status={order.payment_status as PaymentStatus} />
                      <span className="w-24 text-right text-sm font-bold">
                        {formatEGP(order.total)}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
