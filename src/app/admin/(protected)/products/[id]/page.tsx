export const instant = false;

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { getAdminFacets, getAdminProductById } from "@/lib/data/admin";
import { AdminPageHeader } from "@/components/admin/admin-shell";
import { ProductForm, type ProductFormInitial } from "@/components/admin/product-form";

export const metadata: Metadata = { title: "Edit product" };

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [product, facets] = await Promise.all([getAdminProductById(id), getAdminFacets()]);
  if (!product) notFound();

  const initial: ProductFormInitial = {
    id: product.id,
    name: product.name,
    slug: product.slug,
    sku: product.sku,
    price: Number(product.price),
    compare_at_price: product.compare_at_price != null ? Number(product.compare_at_price) : null,
    short_description: product.short_description,
    description: product.description,
    low_stock_threshold: product.low_stock_threshold,
    stock_quantity: product.stock_quantity,
    is_active: product.is_active,
    is_featured: product.is_featured,
    is_best_seller: product.is_best_seller,
    is_customizable: product.is_customizable,
    categoryIds: product.categories.map((category) => category.id),
    tagIds: product.tags.map((tag) => tag.id),
    images: product.images.map((image) => ({
      id: image.id,
      storage_path: image.storage_path,
      alt_text: image.alt_text,
    })),
  };

  return (
    <>
      <Link
        href="/admin/products"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-primary"
      >
        <ArrowLeft className="size-4" aria-hidden />
        All products
      </Link>
      <AdminPageHeader
        title={product.name}
        actions={
          <Link
            href={`/product/${product.slug}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:text-primary-hover"
          >
            <ExternalLink className="size-4" aria-hidden />
            View in store
          </Link>
        }
      />
      <ProductForm initial={initial} categories={facets.categories} tags={facets.tags} />
    </>
  );
}
