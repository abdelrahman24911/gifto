export const instant = false;

import type { Metadata } from "next";
import Link from "next/link";
import { Search, ShoppingBag } from "lucide-react";
import {
  ORDER_SOURCES,
  ORDER_SOURCE_LABELS,
  ORDER_STATUSES,
  ORDER_STATUS_LABELS,
  PAYMENT_STATUSES,
  PAYMENT_STATUS_LABELS,
} from "@/lib/constants";
import { listOrders } from "@/lib/data/orders";
import { adminQuery, first, toPage } from "@/lib/admin-params";
import { formatDateTime, formatEGP, formatNumber } from "@/lib/utils";
import type { OrderStatus, OrderSource, PaymentStatus } from "@/lib/types";
import { AdminPageHeader } from "@/components/admin/admin-shell";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/admin/status-badge";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/field";
import type { OrderWithCustomer } from "@/lib/types";

export const metadata: Metadata = { title: "Orders" };

interface OrdersPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AdminOrdersPage({ searchParams }: OrdersPageProps) {
  const raw = await searchParams;
  const q = first(raw.q).trim();
  const status = first(raw.status) as OrderStatus | "all" | "";
  const payment = first(raw.payment) as PaymentStatus | "all" | "";
  const source = first(raw.source) as OrderSource | "all" | "";
  const page = toPage(raw.page);

  const result = await listOrders({
    search: q || undefined,
    status: status && status !== "all" ? (status as OrderStatus) : "all",
    paymentStatus: payment && payment !== "all" ? (payment as PaymentStatus) : "all",
    source: source && source !== "all" ? (source as OrderSource) : "all",
    page,
  });

  const hrefFor = (target: number) =>
    `/admin/orders${adminQuery({ q, status, payment, source, page: target > 1 ? target : "" })}`;

  const columns: DataTableColumn<OrderWithCustomer>[] = [
    {
      header: "Order",
      cell: (order) => (
        <Link href={`/admin/orders/${order.id}`} className="font-bold text-foreground hover:text-primary">
          {order.order_number}
        </Link>
      ),
    },
    {
      header: "Customer",
      cell: (order) => (
        <div className="min-w-0">
          <p className="truncate font-medium">{order.customer?.full_name ?? "—"}</p>
          <p className="truncate text-xs text-muted-foreground">{order.customer?.phone ?? "—"}</p>
        </div>
      ),
    },
    {
      header: "Placed",
      secondary: true,
      cell: (order) => <span className="text-muted-foreground">{formatDateTime(order.created_at)}</span>,
    },
    {
      header: "Items",
      align: "center",
      cell: (order) => formatNumber(order.item_count),
    },
    {
      header: "Total",
      align: "right",
      cell: (order) => <span className="font-bold">{formatEGP(order.total)}</span>,
    },
    {
      header: "Status",
      cell: (order) => <OrderStatusBadge status={order.status} />,
    },
    {
      header: "Payment",
      secondary: true,
      cell: (order) => <PaymentStatusBadge status={order.payment_status} />,
    },
  ];

  return (
    <>
      <AdminPageHeader
        title="Orders"
        description={`${formatNumber(result.total)} order${result.total === 1 ? "" : "s"}`}
      />

      <form method="get" className="mb-5 flex flex-wrap items-end gap-2">
        <div className="relative min-w-52 flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            name="q"
            defaultValue={q}
            placeholder="Order number, name or phone"
            className="pl-10"
            aria-label="Search orders"
          />
        </div>
        <Select name="status" defaultValue={status || "all"} aria-label="Filter by status" className="w-auto min-w-36">
          <option value="all">All statuses</option>
          {ORDER_STATUSES.map((value) => (
            <option key={value} value={value}>
              {ORDER_STATUS_LABELS[value]}
            </option>
          ))}
        </Select>
        <Select name="payment" defaultValue={payment || "all"} aria-label="Filter by payment" className="w-auto min-w-36">
          <option value="all">All payments</option>
          {PAYMENT_STATUSES.map((value) => (
            <option key={value} value={value}>
              {PAYMENT_STATUS_LABELS[value]}
            </option>
          ))}
        </Select>
        <Select name="source" defaultValue={source || "all"} aria-label="Filter by source" className="w-auto min-w-32">
          <option value="all">All sources</option>
          {ORDER_SOURCES.map((value) => (
            <option key={value} value={value}>
              {ORDER_SOURCE_LABELS[value]}
            </option>
          ))}
        </Select>
        <Button type="submit" variant="outline">Filter</Button>
        {q || (status && status !== "all") || (payment && payment !== "all") || (source && source !== "all") ? (
          <Link href="/admin/orders" className="text-sm font-semibold text-muted-foreground hover:text-primary">
            Clear
          </Link>
        ) : null}
      </form>

      <DataTable
        caption="Orders"
        rows={result.items}
        rowKey={(order) => order.id}
        columns={columns}
        empty={
          <EmptyState
            icon={<ShoppingBag className="size-7" aria-hidden />}
            title="No orders found"
            description="Try a different search or clear the filters."
          />
        }
        renderCard={(order) => (
          <Link href={`/admin/orders/${order.id}`} className="block px-5 py-4 transition-colors hover:bg-surface-muted/50">
            <div className="flex items-center justify-between gap-3">
              <span className="font-bold">{order.order_number}</span>
              <OrderStatusBadge status={order.status} />
            </div>
            <p className="mt-1.5 text-sm font-medium">{order.customer?.full_name ?? "—"}</p>
            <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
              <span>{formatDateTime(order.created_at)}</span>
              <span className="font-bold text-foreground">{formatEGP(order.total)}</span>
            </div>
          </Link>
        )}
      />

      <Pagination page={result.page} pageCount={result.pageCount} hrefFor={hrefFor} className="mt-8" />
    </>
  );
}
