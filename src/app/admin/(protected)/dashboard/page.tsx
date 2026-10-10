export const instant = false;

import Link from "next/link";
import {
  AlertTriangle,
  Ban,
  CircleDollarSign,
  PackageX,
  ReceiptText,
  UserPlus,
} from "lucide-react";
import type { Metadata } from "next";
import { getDashboardStats } from "@/lib/data/analytics";
import { orderStatusHref } from "@/lib/admin-params";
import { formatEGP, formatNumber } from "@/lib/utils";
import { AdminPageHeader } from "@/components/admin/admin-shell";
import { StatCard } from "@/components/admin/stat-card";
import { RevenueChart } from "@/components/admin/revenue-chart";
import { OrderStatusBadge } from "@/components/admin/status-badge";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  const alertCount = stats.lowStockCount + stats.outOfStockCount;

  return (
    <>
      <AdminPageHeader
        title="Dashboard"
        description="A live snapshot of the store — sales, orders and stock."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Revenue today"
          value={formatEGP(stats.revenueToday)}
          hint={`${formatEGP(stats.revenueMonth)} this month`}
          icon={<CircleDollarSign className="size-[18px]" aria-hidden />}
          tone="primary"
        />
        <StatCard
          label="Orders today"
          value={formatNumber(stats.ordersToday)}
          hint={`${formatNumber(stats.ordersPending)} pending`}
          icon={<ReceiptText className="size-[18px]" aria-hidden />}
          tone="info"
        />
        <StatCard
          label="New customers"
          value={formatNumber(stats.newCustomersMonth)}
          hint="Joined this month"
          icon={<UserPlus className="size-[18px]" aria-hidden />}
          tone="accent"
        />
        <StatCard
          label="Stock alerts"
          value={formatNumber(alertCount)}
          hint={`${formatNumber(stats.lowStockCount)} low · ${formatNumber(stats.outOfStockCount)} out`}
          icon={<AlertTriangle className="size-[18px]" aria-hidden />}
          tone={alertCount > 0 ? "warning" : "success"}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <section className="rounded-card border border-border bg-surface p-5 shadow-hairline sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold tracking-tight">Revenue</h2>
              <p className="text-sm text-muted-foreground">Last 30 days</p>
            </div>
          </div>
          <RevenueChart series={stats.series} />
        </section>

        <section className="rounded-card border border-border bg-surface p-5 shadow-hairline sm:p-6">
          <h2 className="text-base font-bold tracking-tight">Orders by status</h2>
          <p className="text-sm text-muted-foreground">Last 30 days</p>

          {stats.statusBreakdown.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No orders yet.</p>
          ) : (
            <ul className="mt-5 space-y-3">
              {stats.statusBreakdown.map((row) => (
                <li key={row.status} className="flex items-center justify-between gap-4">
                  <OrderStatusBadge status={row.status} />
                  <Link
                    href={orderStatusHref(row.status)}
                    className="text-sm font-bold text-foreground transition-colors hover:text-primary"
                  >
                    {formatNumber(row.count)}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="rounded-card border border-border bg-surface p-5 shadow-hairline sm:p-6">
          <h2 className="text-base font-bold tracking-tight">Top products</h2>
          <p className="text-sm text-muted-foreground">By revenue, last 30 days</p>

          {stats.topProducts.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No product sales yet.
            </p>
          ) : (
            <ol className="mt-5 divide-y divide-border">
              {stats.topProducts.map((product, index) => (
                <li key={product.name} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                  <span className="grid size-7 shrink-0 place-items-center rounded-pill bg-surface-muted text-xs font-bold text-muted-foreground">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">{product.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatNumber(product.quantity)} sold
                    </p>
                  </div>
                  <span className="text-sm font-bold">{formatEGP(product.revenue)}</span>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section className="rounded-card border border-border bg-surface p-5 shadow-hairline sm:p-6">
          <h2 className="text-base font-bold tracking-tight">Needs attention</h2>
          <p className="text-sm text-muted-foreground">Stock running low or gone</p>

          {alertCount === 0 ? (
            <div className="mt-4">
              <EmptyState
                compact
                icon={<PackageX className="size-6" aria-hidden />}
                title="All stocked up"
                description="Nothing is low or out of stock right now."
              />
            </div>
          ) : (
            <dl className="mt-5 grid grid-cols-2 gap-4">
              <Link
                href="/admin/inventory?status=low_stock"
                className="rounded-card border border-border bg-warning-soft/60 p-4 transition-colors hover:border-warning/40"
              >
                <dt className="text-xs font-bold uppercase tracking-[0.07em] text-warning">
                  Low stock
                </dt>
                <dd className="mt-1 text-2xl font-extrabold">{formatNumber(stats.lowStockCount)}</dd>
              </Link>
              <Link
                href="/admin/inventory?status=out_of_stock"
                className="rounded-card border border-border bg-destructive-soft/60 p-4 transition-colors hover:border-destructive/40"
              >
                <dt className="text-xs font-bold uppercase tracking-[0.07em] text-destructive">
                  Out of stock
                </dt>
                <dd className="mt-1 text-2xl font-extrabold">
                  {formatNumber(stats.outOfStockCount)}
                </dd>
              </Link>
            </dl>
          )}

          <Link
            href="/admin/orders?status=pending"
            className="mt-5 flex items-center gap-2 text-sm font-bold text-primary transition-colors hover:text-primary-hover"
          >
            <Ban className="size-4" aria-hidden />
            Review pending orders
          </Link>
        </section>
      </div>
    </>
  );
}
