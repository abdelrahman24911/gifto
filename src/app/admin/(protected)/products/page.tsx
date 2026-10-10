export const instant = false;

import type { Metadata } from "next";
import Link from "next/link";
import { Package, Pencil, Plus, Search } from "lucide-react";
import { listAdminCategories, listAdminProducts, type AdminProductRow } from "@/lib/data/admin";
import { first, toPage, adminQuery } from "@/lib/admin-params";
import { formatEGP, formatNumber } from "@/lib/utils";
import { AdminPageHeader } from "@/components/admin/admin-shell";
import { InventoryStatusBadge } from "@/components/admin/status-badge";
import { toggleProductActive } from "@/app/admin/(protected)/products/actions";
import { ProductImage } from "@/components/commerce/product-image";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/field";

export const metadata: Metadata = { title: "Products" };

function stockStatus(product: AdminProductRow) {
  if (product.stock_quantity <= 0) return "out_of_stock";
  if (product.stock_quantity <= product.low_stock_threshold) return "low_stock";
  return "healthy";
}

interface ProductsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AdminProductsPage({ searchParams }: ProductsPageProps) {
  const raw = await searchParams;
  const q = first(raw.q).trim();
  const status = first(raw.status);
  const category = first(raw.category);
  const page = toPage(raw.page);

  const [result, categories] = await Promise.all([
    listAdminProducts({
      search: q || undefined,
      status: status === "active" || status === "inactive" ? status : "all",
      category: category || undefined,
      page,
    }),
    listAdminCategories(),
  ]);

  const hrefFor = (target: number) =>
    `/admin/products${adminQuery({ q, status, category, page: target > 1 ? target : "" })}`;

  const columns: DataTableColumn<AdminProductRow>[] = [
    {
      header: "Product",
      cell: (product) => (
        <div className="flex items-center gap-3">
          <ProductImage
            path={product.images[0]?.storage_path ?? null}
            alt={product.name}
            className="size-11 shrink-0 rounded-md"
            sizes="44px"
          />
          <div className="min-w-0">
            <Link
              href={`/admin/products/${product.id}`}
              className="block truncate font-bold text-foreground hover:text-primary"
            >
              {product.name}
            </Link>
            <p className="truncate text-xs text-muted-foreground">
              {product.sku ? `${product.sku} · ` : ""}
              {product.slug}
            </p>
          </div>
        </div>
      ),
    },
    {
      header: "Price",
      align: "right",
      cell: (product) => <span className="font-bold">{formatEGP(product.price)}</span>,
    },
    {
      header: "Stock",
      align: "center",
      cell: (product) => (
        <div className="flex flex-col items-center gap-1">
          <span className="font-bold tabular-nums">{formatNumber(product.stock_quantity)}</span>
          <InventoryStatusBadge status={stockStatus(product)} />
        </div>
      ),
    },
    {
      header: "Categories",
      secondary: true,
      cell: (product) => (
        <span className="text-xs text-muted-foreground">
          {product.categories.map((category) => category.name).join(", ") || "—"}
        </span>
      ),
    },
    {
      header: "Visibility",
      align: "center",
      cell: (product) => (
        <form action={toggleProductActive}>
          <input type="hidden" name="id" value={product.id} />
          <input type="hidden" name="is_active" value={String(!product.is_active)} />
          <button
            type="submit"
            className={
              product.is_active
                ? "rounded-pill bg-success-soft px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.06em] text-success transition-colors hover:brightness-95"
                : "rounded-pill bg-surface-muted px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.06em] text-muted-foreground transition-colors hover:brightness-95"
            }
          >
            {product.is_active ? "Active" : "Hidden"}
          </button>
        </form>
      ),
    },
    {
      header: "",
      align: "right",
      cell: (product) => (
        <Link
          href={`/admin/products/${product.id}`}
          className="inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:text-primary-hover"
        >
          <Pencil className="size-4" aria-hidden />
          Edit
        </Link>
      ),
    },
  ];

  return (
    <>
      <AdminPageHeader
        title="Products"
        description={`${formatNumber(result.total)} product${result.total === 1 ? "" : "s"}`}
        actions={
          <Link href="/admin/products/new">
            <span className="inline-flex h-11 items-center gap-2 rounded-pill bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-hairline transition-colors hover:bg-primary-hover">
              <Plus className="size-[18px]" aria-hidden />
              New product
            </span>
          </Link>
        }
      />

      <form method="get" className="mb-5 flex flex-wrap items-end gap-2">
        <div className="relative min-w-52 flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input name="q" defaultValue={q} placeholder="Search name, SKU or slug" className="pl-10" aria-label="Search products" />
        </div>
        <Select name="category" defaultValue={category} aria-label="Filter by category" className="w-auto min-w-40">
          <option value="">All categories</option>
          {categories.map((item) => (
            <option key={item.id} value={item.slug}>
              {item.name}
            </option>
          ))}
        </Select>
        <Select name="status" defaultValue={status} aria-label="Filter by visibility" className="w-auto min-w-32">
          <option value="">All visibility</option>
          <option value="active">Active</option>
          <option value="inactive">Hidden</option>
        </Select>
        <Button type="submit" variant="outline">Filter</Button>
        {q || status || category ? (
          <Link href="/admin/products" className="text-sm font-semibold text-muted-foreground hover:text-primary">
            Clear
          </Link>
        ) : null}
      </form>

      <DataTable
        caption="Products"
        rows={result.items}
        rowKey={(product) => product.id}
        columns={columns}
        empty={
          <EmptyState
            icon={<Package className="size-7" aria-hidden />}
            title="No products found"
            description="Adjust your filters or add a new product."
          />
        }
        renderCard={(product) => (
          <div className="px-5 py-4">
            <div className="flex items-center gap-3">
              <ProductImage
                path={product.images[0]?.storage_path ?? null}
                alt={product.name}
                className="size-12 shrink-0 rounded-md"
                sizes="48px"
              />
              <div className="min-w-0 flex-1">
                <Link href={`/admin/products/${product.id}`} className="block truncate font-bold hover:text-primary">
                  {product.name}
                </Link>
                <p className="text-xs text-muted-foreground">{formatEGP(product.price)}</p>
              </div>
              <InventoryStatusBadge status={stockStatus(product)} />
            </div>
          </div>
        )}
      />

      <Pagination page={result.page} pageCount={result.pageCount} hrefFor={hrefFor} className="mt-8" />
    </>
  );
}
