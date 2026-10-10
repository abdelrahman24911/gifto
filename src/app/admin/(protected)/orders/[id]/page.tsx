export const instant = false;

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MessageSquareQuote, Phone, Mail, MapPin, User } from "lucide-react";
import { ORDER_SOURCE_LABELS } from "@/lib/constants";
import { getOrderDetail } from "@/lib/data/orders";
import { formatDateTime, formatEGP } from "@/lib/utils";
import { AdminPageHeader } from "@/components/admin/admin-shell";
import { OrderActions } from "@/components/admin/order-actions";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/admin/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Order" };

function personalizationEntries(data: unknown): [string, string][] {
  if (!data || typeof data !== "object") return [];
  return Object.entries(data as Record<string, unknown>)
    .filter(([, value]) => typeof value === "string" && value.length > 0)
    .map(([key, value]) => [key, String(value)]);
}

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getOrderDetail(id);
  if (!order) notFound();

  const customer = order.customer;

  return (
    <>
      <Link
        href="/admin/orders"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-primary"
      >
        <ArrowLeft className="size-4" aria-hidden />
        All orders
      </Link>

      <AdminPageHeader
        title={order.order_number}
        description={`Placed ${formatDateTime(order.created_at)} · ${ORDER_SOURCE_LABELS[order.source]}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <OrderStatusBadge status={order.status} />
            <PaymentStatusBadge status={order.payment_status} />
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6">
          <section className="overflow-hidden rounded-card border border-border bg-surface shadow-hairline">
            <div className="border-b border-border px-5 py-4 sm:px-6">
              <h2 className="text-base font-bold tracking-tight">Items</h2>
            </div>
            <ul className="divide-y divide-border">
              {order.items.map((item) => {
                const personalization = personalizationEntries(item.personalization_data);
                return (
                  <li key={item.id} className="flex items-start justify-between gap-4 px-5 py-4 sm:px-6">
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground">{item.product_name_snapshot}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {formatEGP(item.unit_price)} × {item.quantity}
                      </p>
                      {personalization.length > 0 ? (
                        <ul className="mt-2 space-y-0.5">
                          {personalization.map(([key, value]) => (
                            <li key={key} className="text-xs text-muted-foreground">
                              <span className="font-semibold capitalize text-foreground/80">{key}:</span>{" "}
                              {value}
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                    <span className="shrink-0 font-bold">
                      {formatEGP(Number(item.unit_price) * item.quantity)}
                    </span>
                  </li>
                );
              })}
            </ul>
            <dl className="space-y-2 border-t border-border bg-surface-muted/50 px-5 py-4 text-sm sm:px-6">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd className="font-medium">{formatEGP(order.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Delivery</dt>
                <dd className="font-medium">{formatEGP(order.delivery_fee)}</dd>
              </div>
              <div className="flex justify-between border-t border-border pt-2 text-base">
                <dt className="font-bold">Total</dt>
                <dd className="font-extrabold">{formatEGP(order.total)}</dd>
              </div>
            </dl>
          </section>

          {order.gift_message ? (
            <section className="rounded-card border border-border bg-primary-soft/50 p-5 shadow-hairline sm:p-6">
              <h2 className="flex items-center gap-2 text-sm font-bold">
                <MessageSquareQuote className="size-4 text-primary" aria-hidden />
                Gift message
              </h2>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-foreground/90">
                {order.gift_message}
              </p>
            </section>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle>Delivery</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="flex items-start gap-2">
                <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                <span>
                  {order.delivery_address}
                  <br />
                  <span className="text-muted-foreground">
                    {order.area ? `${order.area}, ` : ""}
                    {order.governorate}
                  </span>
                </span>
              </p>
              {order.notes ? (
                <p className="rounded-md bg-surface-muted px-3 py-2 text-xs text-muted-foreground">
                  {order.notes}
                </p>
              ) : null}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <section className="rounded-card border border-border bg-surface p-5 shadow-hairline sm:p-6">
            <h2 className="mb-5 text-base font-bold tracking-tight">Manage</h2>
            <OrderActions
              orderId={order.id}
              status={order.status}
              paymentStatus={order.payment_status}
            />
          </section>

          <section className="rounded-card border border-border bg-surface p-5 shadow-hairline sm:p-6">
            <h2 className="mb-4 text-base font-bold tracking-tight">Customer</h2>
            <dl className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <User className="size-4 text-muted-foreground" aria-hidden />
                <span className="font-medium">{customer?.full_name ?? "—"}</span>
              </div>
              {customer?.phone ? (
                <div className="flex items-center gap-2">
                  <Phone className="size-4 text-muted-foreground" aria-hidden />
                  <a href={`tel:${customer.phone}`} className="hover:text-primary">
                    {customer.phone}
                  </a>
                </div>
              ) : null}
              {customer?.email ? (
                <div className="flex items-center gap-2">
                  <Mail className="size-4 text-muted-foreground" aria-hidden />
                  <a href={`mailto:${customer.email}`} className="break-all hover:text-primary">
                    {customer.email}
                  </a>
                </div>
              ) : null}
            </dl>
            {customer ? (
              <Link
                href={`/admin/customers/${customer.id}`}
                className="mt-4 inline-block text-sm font-bold text-primary hover:text-primary-hover"
              >
                View customer
              </Link>
            ) : null}
          </section>

          <section className="rounded-card border border-border bg-surface p-5 shadow-hairline sm:p-6">
            <h2 className="mb-4 text-base font-bold tracking-tight">History</h2>
            <ol className="space-y-4">
              {order.status_history
                .slice()
                .reverse()
                .map((entry) => (
                  <li key={entry.id} className="relative border-l-2 border-border pl-4">
                    <span className="absolute -left-[5px] top-1 size-2 rounded-pill bg-primary" aria-hidden />
                    <p className="text-sm font-semibold capitalize">
                      {entry.from_status ? `${entry.from_status} → ` : ""}
                      {entry.to_status}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatDateTime(entry.created_at)}</p>
                    {entry.note ? (
                      <p className="mt-1 text-xs text-muted-foreground">{entry.note}</p>
                    ) : null}
                  </li>
                ))}
            </ol>
          </section>
        </div>
      </div>
    </>
  );
}
