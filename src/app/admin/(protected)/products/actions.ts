"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { upsertProduct, setProductActive } from "@/lib/data/admin";
import { requireStaff } from "@/lib/data/auth";
import { slugify } from "@/lib/utils";

export type ProductFormState = { error?: string } | null;

function numberOrNull(value: FormDataEntryValue | null): number | null {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

function intOr(value: FormDataEntryValue | null, fallback: number): number {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export async function saveProduct(
  _prev: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  await requireStaff();

  const id = String(formData.get("id") ?? "").trim() || undefined;
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const shortDescription = String(formData.get("short_description") ?? "").trim();
  const price = numberOrNull(formData.get("price"));
  const compareAt = numberOrNull(formData.get("compare_at_price"));

  if (name.length < 2) return { error: "Enter a product name." };
  if (description.length < 10) return { error: "Enter a longer description." };
  if (price === null || price < 0) return { error: "Enter a valid price." };
  if (compareAt !== null && compareAt < price) {
    return { error: "Compare-at price should be higher than the price." };
  }

  const slug = slugify(String(formData.get("slug") ?? "").trim() || name);
  if (!slug) return { error: "Enter a valid slug." };

  const categoryIds = formData.getAll("categoryIds").map(String).filter(Boolean);
  const tagIds = formData.getAll("tagIds").map(String).filter(Boolean);

  try {
    await upsertProduct({
      id,
      name,
      slug,
      sku: String(formData.get("sku") ?? "").trim() || null,
      price,
      compare_at_price: compareAt,
      short_description: shortDescription || null,
      description,
      low_stock_threshold: intOr(formData.get("low_stock_threshold"), 5),
      stock_quantity: intOr(formData.get("stock_quantity"), 0),
      is_active: formData.get("is_active") === "on",
      is_featured: formData.get("is_featured") === "on",
      is_best_seller: formData.get("is_best_seller") === "on",
      is_customizable: formData.get("is_customizable") === "on",
      categoryIds,
      tagIds,
    });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not save the product." };
  }

  revalidatePath("/admin/products");
  redirect("/admin/products");
}

export async function toggleProductActive(formData: FormData): Promise<void> {
  await requireStaff();
  const id = String(formData.get("id") ?? "");
  const next = formData.get("is_active") === "true";
  if (!id) return;
  await setProductActive(id, next);
  revalidatePath("/admin/products");
}
