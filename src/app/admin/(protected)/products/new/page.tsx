export const instant = false;

import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getAdminFacets } from "@/lib/data/admin";
import { AdminPageHeader } from "@/components/admin/admin-shell";
import { ProductForm } from "@/components/admin/product-form";

export const metadata: Metadata = { title: "New product" };

export default async function NewProductPage() {
  const facets = await getAdminFacets();

  return (
    <>
      <Link
        href="/admin/products"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-primary"
      >
        <ArrowLeft className="size-4" aria-hidden />
        All products
      </Link>
      <AdminPageHeader title="New product" description="Add a gift to the catalogue." />
      <ProductForm categories={facets.categories} tags={facets.tags} />
    </>
  );
}
