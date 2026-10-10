export const instant = false;

import type { Metadata } from "next";
import Link from "next/link";
import { Search, Users } from "lucide-react";
import { listCustomers, type CustomerListRow } from "@/lib/data/customers";
import { first, toPage, adminQuery } from "@/lib/admin-params";
import { formatDate, formatEGP, formatNumber } from "@/lib/utils";
import { AdminPageHeader } from "@/components/admin/admin-shell";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";

export const metadata: Metadata = { title: "Customers" };

interface CustomersPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AdminCustomersPage({ searchParams }: CustomersPageProps) {
  const raw = await searchParams;
  const q = first(raw.q).trim();
  const page = toPage(raw.page);

  const result = await listCustomers({ search: q || undefined, page });
  const hrefFor = (target: number) =>
    `/admin/customers${adminQuery({ q, page: target > 1 ? target : "" })}`;

  const columns: DataTableColumn<CustomerListRow>[] = [
    {
      header: "Customer",
      cell: (customer) => (
        <div className="min-w-0">
          <Link
            href={`/admin/customers/${customer.id}`}
            className="block truncate font-bold text-foreground hover:text-primary"
          >
            {customer.full_name ?? "—"}
          </Link>
          <p className="truncate text-xs text-muted-foreground">{customer.phone ?? "—"}</p>
        </div>
      ),
    },
    {
      header: "Email",
      secondary: true,
      cell: (customer) => <span className="text-muted-foreground">{customer.email ?? "—"}</span>,
    },
    {
      header: "Orders",
      align: "center",
      cell: (customer) => formatNumber(customer.order_count ?? 0),
    },
    {
      header: "Total spent",
      align: "right",
      cell: (customer) => <span className="font-bold">{formatEGP(customer.total_spent ?? 0)}</span>,
    },
    {
      header: "Last order",
      secondary: true,
      cell: (customer) => (
        <span className="text-muted-foreground">{formatDate(customer.last_order_at)}</span>
      ),
    },
    {
      header: "",
      align: "right",
      cell: (customer) => (
        <Link href={`/admin/customers/${customer.id}`} className="text-sm font-bold text-primary hover:text-primary-hover">
          View
        </Link>
      ),
    },
  ];

  return (
    <>
      <AdminPageHeader
        title="Customers"
        description={`${formatNumber(result.total)} customer${result.total === 1 ? "" : "s"}`}
      />

      <form method="get" className="mb-5 flex flex-wrap items-end gap-2">
        <div className="relative min-w-52 flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input name="q" defaultValue={q} placeholder="Search name, phone or email" className="pl-10" aria-label="Search customers" />
        </div>
        <Button type="submit" variant="outline">Search</Button>
        {q ? (
          <Link href="/admin/customers" className="text-sm font-semibold text-muted-foreground hover:text-primary">
            Clear
          </Link>
        ) : null}
      </form>

      <DataTable
        caption="Customers"
        rows={result.items}
        rowKey={(customer) => customer.id}
        columns={columns}
        empty={
          <EmptyState
            icon={<Users className="size-7" aria-hidden />}
            title="No customers found"
            description="Try a different search."
          />
        }
        renderCard={(customer) => (
          <Link href={`/admin/customers/${customer.id}`} className="block px-5 py-4 transition-colors hover:bg-surface-muted/50">
            <div className="flex items-center justify-between gap-3">
              <span className="font-bold">{customer.full_name ?? "—"}</span>
              <span className="text-sm font-bold">{formatEGP(customer.total_spent ?? 0)}</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {customer.phone ?? "—"} · {formatNumber(customer.order_count ?? 0)} orders
            </p>
          </Link>
        )}
      />

      <Pagination page={result.page} pageCount={result.pageCount} hrefFor={hrefFor} className="mt-8" />
    </>
  );
}
