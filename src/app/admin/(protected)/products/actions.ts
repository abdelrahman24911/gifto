"use server";

import { redirect } from "next/navigation";
import { revalidatePath, revalidateTag } from "next/cache";
import {
  upsertProduct,
  setProductActive,
  saveProductImages,
  type ProductImagePlanEntry,
} from "@/lib/data/admin";
import { requireStaff } from "@/lib/data/auth";
import { slugify } from "@/lib/utils";

export type ProductFormState =
  | { error?: string; productId?: string }
  | null;

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

/** Parses the ordered image plan the client posted, ignoring malformed entries. */
function parseImagePlan(value: FormDataEntryValue | null): ProductImagePlanEntry[] {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(String(value));
    if (!Array.isArray(parsed)) return [];
    const plan: ProductImagePlanEntry[] = [];
    for (const entry of parsed) {
      if (!entry || typeof entry !== "object") continue;
      const kind = (entry as { kind?: unknown }).kind;
      const id = (entry as { id?: unknown }).id;
      if (kind === "existing" && typeof id === "string") plan.push({ kind: "existing", id });
      else if (kind === "new") plan.push({ kind: "new" });
    }
    return plan;
  } catch {
    return [];
  }
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

  const plan = parseImagePlan(formData.get("imagePlan"));
  const coverIndex = Number.parseInt(String(formData.get("coverIndex") ?? "-1"), 10);
  const files = formData
    .getAll("images")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);

  let productId: string;
  try {
    productId = await upsertProduct({
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

  const images = await saveProductImages({ productId, plan, coverIndex, files });

  revalidateTag("catalog", "max");
  revalidatePath("/shop");
  revalidatePath(`/product/${slug}`);
  revalidatePath("/");

  if (!images.ok) {
    return {
      error: `Product saved, but its images could not be uploaded: ${images.errors
        .slice(0, 3)
        .join("; ")}. Fix or remove the file(s) and save again.`,
      productId,
    };
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
