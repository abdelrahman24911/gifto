export const instant = false;

import type { Metadata } from "next";
import Link from "next/link";
import { Boxes, Search } from "lucide-react";
import { MOVEMENT_LABELS } from "@/lib/constants";
import { listInventory, listMovements } from "@/lib/data/inventory";
import { first, toPage, adminQuery } from "@/lib/admin-params";
import { formatDateTime, formatNumber } from "@/lib/utils";
import type { InventoryItem, MovementType } from "@/lib/types";
import { AdminPageHeader } from "@/components/admin/admin-shell";
import { InventoryStatusBadge } from "@/components/admin/status-badge";
import { StockAdjust } from "@/components/admin/stock-adjust";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/field";

export const metadata: Metadata = { title: "Inventory" };

interface InventoryPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AdminInventoryPage({ searchParams }: InventoryPageProps) {
  const raw = await searchParams;
  const q = first(raw.q).trim();
  const status = first(raw.status);
  const page = toPage(raw.page);

  const [result, movements] = await Promise.all([
    listInventory({
      search: q || undefined,
      status:
        status === "healthy" || status === "low_stock" || status === "out_of_stock"
          ? status
          : "all",
      page,
    }),
    listMovements({ pageSize: 15 }),
  ]);

  const hrefFor = (target: number) =>
    `/admin/inventory${adminQuery({ q, status, page: target > 1 ? target : "" })}`;

  const columns: DataTableColumn<InventoryItem>[] = [
    {
      header: "Product",
      cell: (item) => (
        <div className="min-w-0">
          <p className="truncate font-bold text-foreground">{item.name ?? "—"}</p>
          <p className="truncate text-xs text-muted-foreground">{item.sku ?? item.slug ?? "—"}</p>
        </div>
      ),
    },
    {
      header: "Available",
      align: "right",
      cell: (item) => <span className="font-bold tabular-nums">{formatNumber(item.stock_quantity)}</span>,
    },
    {
      header: "Reserved",
      align: "right",
      secondary: true,
      cell: (item) => <span className="tabular-nums text-muted-foreground">{formatNumber(item.reserved_quantity)}</span>,
    },
    {
      header: "On hand",
      align: "right",
      cell: (item) => <span className="tabular-nums">{formatNumber(item.on_hand_quantity)}</span>,
    },
    {
      header: "Status",
      cell: (item) => <InventoryStatusBadge status={item.status} />,
    },
    {
      header: "Updated",
      secondary: true,
      cell: (item) => <span className="text-xs text-muted-foreground">{formatDateTime(item.updated_at)}</span>,
    },
    {
      header: "",
      align: "right",
      cell: (item) =>
        item.product_id ? (
          <StockAdjust
            productId={item.product_id}
            productName={item.name ?? "Product"}
            stockQuantity={item.stock_quantity ?? 0}
          />
        ) : null,
    },
  ];

  return (
    <>
      <AdminPageHeader
        title="Inventory"
        description={`${formatNumber(result.total)} item${result.total === 1 ? "" : "s"} tracked`}
      />

      <form method="get" className="mb-5 flex flex-wrap items-end gap-2">
        <div className="relative min-w-52 flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input name="q" defaultValue={q} placeholder="Search name or SKU" className="pl-10" aria-label="Search inventory" />
        </div>
        <Select name="status" defaultValue={status} aria-label="Filter by stock status" className="w-auto min-w-40">
          <option value="">All stock levels</option>
          <option value="healthy">In stock</option>
          <option value="low_stock">Low stock</option>
          <option value="out_of_stock">Out of stock</option>
        </Select>
        <Button type="submit" variant="outline">Filter</Button>
        {q || status ? (
          <Link href="/admin/inventory" className="text-sm font-semibold text-muted-foreground hover:text-primary">
            Clear
          </Link>
        ) : null}
      </form>

      <DataTable
        caption="Inventory"
        rows={result.items}
        rowKey={(item) => item.product_id ?? String(item.name)}
        columns={columns}
        empty={
          <EmptyState
            icon={<Boxes className="size-7" aria-hidden />}
            title="No inventory items"
            description="Adjust your filters to see stock."
          />
        }
        renderCard={(item) => (
          <div className="px-5 py-4">
            <div className="flex items-center justify-between gap-3">
              <span className="truncate font-bold">{item.name ?? "—"}</span>
              <InventoryStatusBadge status={item.status} />
            </div>
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Available <span className="font-bold text-foreground">{formatNumber(item.stock_quantity)}</span>
              </span>
              {item.product_id ? (
                <StockAdjust
                  productId={item.product_id}
                  productName={item.name ?? "Product"}
                  stockQuantity={item.stock_quantity ?? 0}
                />
              ) : null}
            </div>
          </div>
        )}
      />

      <Pagination page={result.page} pageCount={result.pageCount} hrefFor={hrefFor} className="mt-8" />

      <section className="mt-10">
        <h2 className="mb-4 text-base font-bold tracking-tight">Recent stock movements</h2>
        {movements.items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No movements recorded yet.</p>
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-card border border-border bg-surface shadow-hairline">
            {movements.items.map((movement) => (
              <li key={movement.id} className="flex items-center gap-4 px-5 py-3.5">
                <Badge variant={movement.quantity >= 0 ? "success" : "destructive"}>
                  {movement.quantity >= 0 ? `+${movement.quantity}` : movement.quantity}
                </Badge>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    {movement.product?.name ?? "Deleted product"}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {(MOVEMENT_LABELS[movement.type as MovementType] ?? movement.type)} ·{" "}
                    {movement.note ?? "—"}
                  </p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {formatDateTime(movement.created_at)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
