import { revalidatePath, revalidateTag } from "next/cache";
import { ADMIN_PAGE_SIZE, TAG_KINDS } from "@/lib/constants";
import {
  buildProductImagePath,
  PRODUCT_IMAGE_BUCKET,
  validateProductImageFile,
} from "@/lib/storage";
import { createClient } from "@/lib/supabase/server";
import type {
  Category,
  Product,
  ProductImage,
  ProductOption,
  ProductOptionValue,
  ProductTag,
} from "@/lib/types";

export type AdminProductStatus = "all" | "active" | "inactive";

export interface AdminProductRow extends Product {
  images: ProductImage[];
  categories: Pick<Category, "id" | "name" | "slug">[];
  tags: Pick<ProductTag, "id" | "name" | "slug" | "kind">[];
}

function bySortOrder<T extends { sort_order: number }>(a: T, b: T) {
  return a.sort_order - b.sort_order;
}

const ADMIN_PRODUCT_SELECT = `
  *,
  images:product_images(*),
  categories:product_categories(category:categories(id, name, slug)),
  tags:product_tag_relations(tag:product_tags(id, name, slug, kind))
`;

interface RawProduct extends Omit<AdminProductRow, "images" | "categories" | "tags"> {
  images: ProductImage[] | null;
  categories: { category: Pick<Category, "id" | "name" | "slug"> | null }[] | null;
  tags: { tag: Pick<ProductTag, "id" | "name" | "slug" | "kind"> | null }[] | null;
}

function toAdminProduct(raw: RawProduct): AdminProductRow {
  const images = [...(raw.images ?? [])].sort(
    (a, b) => Number(b.is_primary) - Number(a.is_primary) || bySortOrder(a, b),
  );
  return {
    ...raw,
    images,
    categories: (raw.categories ?? [])
      .map((link) => link.category)
      .filter((category): category is NonNullable<typeof category> => Boolean(category)),
    tags: (raw.tags ?? [])
      .map((link) => link.tag)
      .filter((tag): tag is NonNullable<typeof tag> => Boolean(tag)),
  };
}

function sanitize(term: string) {
  return term.trim().replace(/[%_,()\\]/g, " ").trim();
}

/* -------------------------------------------------------------------------- */
/* products                                                                    */
/* -------------------------------------------------------------------------- */

export interface AdminProductFilters {
  search?: string;
  status?: AdminProductStatus;
  category?: string;
  page?: number;
  pageSize?: number;
}

export async function listAdminProducts(
  filters: AdminProductFilters = {},
): Promise<{ items: AdminProductRow[]; total: number; page: number; pageCount: number }> {
  const supabase = await createClient();
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = filters.pageSize ?? ADMIN_PAGE_SIZE;

  let query = supabase.from("products").select(ADMIN_PRODUCT_SELECT, { count: "exact" });

  if (filters.status === "active") query = query.eq("is_active", true);
  if (filters.status === "inactive") query = query.eq("is_active", false);

  if (filters.search) {
    const term = sanitize(filters.search);
    if (term) query = query.or(`name.ilike.%${term}%,sku.ilike.%${term}%,slug.ilike.%${term}%`);
  }

  if (filters.category) {
    const { data: links } = await supabase
      .from("product_categories")
      .select("product_id, category:categories!inner(slug)")
      .eq("category.slug", filters.category);
    const ids = (links ?? []).map((row) => row.product_id);
    query = query.in("id", ids.length > 0 ? ids : ["00000000-0000-0000-0000-000000000000"]);
  }

  const from = (page - 1) * pageSize;
  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(from, from + pageSize - 1);

  if (error) throw new Error(error.message);

  const total = count ?? 0;
  return {
    items: (data ?? []).map((row) => toAdminProduct(row as unknown as RawProduct)),
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export interface AdminProductDetail extends AdminProductRow {
  options: (ProductOption & { values: ProductOptionValue[] })[];
}

export async function getAdminProductById(id: string): Promise<AdminProductDetail | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(`${ADMIN_PRODUCT_SELECT}, options:product_options(*, values:product_option_values(*))`)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  const raw = data as unknown as RawProduct & {
    options: (ProductOption & { values: ProductOptionValue[] | null })[] | null;
  };

  const product = toAdminProduct(raw);
  const options = [...(raw.options ?? [])]
    .sort(bySortOrder)
    .map((option) => ({ ...option, values: [...(option.values ?? [])].sort(bySortOrder) }));

  return { ...product, options };
}

export interface AdminFacets {
  categories: Pick<Category, "id" | "name" | "slug">[];
  tags: Pick<ProductTag, "id" | "name" | "slug" | "kind">[];
}

export async function getAdminFacets(): Promise<AdminFacets> {
  const supabase = await createClient();
  const [categoriesResult, tagsResult] = await Promise.all([
    supabase.from("categories").select("id, name, slug").order("sort_order", { ascending: true }),
    supabase.from("product_tags").select("id, name, slug, kind").order("sort_order", { ascending: true }),
  ]);

  if (categoriesResult.error) throw new Error(categoriesResult.error.message);
  if (tagsResult.error) throw new Error(tagsResult.error.message);

  return {
    categories: categoriesResult.data ?? [],
    tags: tagsResult.data ?? [],
  };
}

export interface UpsertProductInput {
  id?: string;
  name: string;
  slug: string;
  sku: string | null;
  price: number;
  compare_at_price: number | null;
  short_description: string | null;
  description: string;
  low_stock_threshold: number;
  stock_quantity: number;
  is_active: boolean;
  is_featured: boolean;
  is_best_seller: boolean;
  is_customizable: boolean;
  categoryIds: string[];
  tagIds: string[];
}

export async function upsertProduct(input: UpsertProductInput): Promise<string> {
  const supabase = await createClient();

  const payload = {
    name: input.name,
    slug: input.slug,
    sku: input.sku,
    price: input.price,
    compare_at_price: input.compare_at_price,
    short_description: input.short_description,
    description: input.description,
    low_stock_threshold: input.low_stock_threshold,
    is_active: input.is_active,
    is_featured: input.is_featured,
    is_best_seller: input.is_best_seller,
    is_customizable: input.is_customizable,
  };

  let productId = input.id;

  if (productId) {
    const { error } = await supabase.from("products").update(payload).eq("id", productId);
    if (error) throw new Error(error.message);
  } else {
    const { data, error } = await supabase
      .from("products")
      .insert({ ...payload, stock_quantity: input.stock_quantity })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    productId = data.id;
  }

  const { error: categoryError } = await supabase
    .from("product_categories")
    .delete()
    .eq("product_id", productId);
  if (categoryError) throw new Error(categoryError.message);

  if (input.categoryIds.length > 0) {
    const { error } = await supabase
      .from("product_categories")
      .insert(input.categoryIds.map((categoryId) => ({ product_id: productId!, category_id: categoryId })));
    if (error) throw new Error(error.message);
  }

  const { error: tagError } = await supabase
    .from("product_tag_relations")
    .delete()
    .eq("product_id", productId);
  if (tagError) throw new Error(tagError.message);

  if (input.tagIds.length > 0) {
    const { error } = await supabase
      .from("product_tag_relations")
      .insert(input.tagIds.map((tagId) => ({ product_id: productId!, tag_id: tagId })));
    if (error) throw new Error(error.message);
  }

  revalidateTag("catalog", "max");
  revalidatePath("/admin/products");
  revalidatePath("/admin/dashboard");
  return productId;
}

export async function setProductActive(id: string, isActive: boolean): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("products").update({ is_active: isActive }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidateTag("catalog", "max");
  revalidatePath("/admin/products");
}

/* -------------------------------------------------------------------------- */
/* product images                                                              */
/* -------------------------------------------------------------------------- */

/** One entry in the ordered image plan the admin form submits. */
export type ProductImagePlanEntry =
  | { kind: "existing"; id: string }
  | { kind: "new" };

export interface SaveProductImagesInput {
  productId: string;
  /** Ordered list describing the product's final gallery. */
  plan: ProductImagePlanEntry[];
  /** Index into `plan` whose entry becomes the primary image (-1 for none). */
  coverIndex: number;
  /** Newly picked files, in the same order as the `new` entries in `plan`. */
  files: File[];
}

export interface SaveProductImagesResult {
  ok: boolean;
  uploaded: number;
  errors: string[];
}

interface ExistingImageRow {
  id: string;
  storage_path: string;
  alt_text: string | null;
}

/**
 * Reconciles a product's gallery: uploads new files to Storage, then rewrites
 * `product_images` so it matches the submitted order + cover selection.
 *
 * Failure is handled before any database change: if a file cannot be validated
 * or uploaded, nothing is written and every file already uploaded in this call
 * is removed, so no broken references or orphaned objects are left behind.
 */
export async function saveProductImages(
  input: SaveProductImagesInput,
): Promise<SaveProductImagesResult> {
  const supabase = await createClient();
  const { productId, plan, files } = input;
  const bucket = supabase.storage.from(PRODUCT_IMAGE_BUCKET);

  const { data: existingData, error: existingError } = await supabase
    .from("product_images")
    .select("id, storage_path, alt_text")
    .eq("product_id", productId);
  if (existingError) return { ok: false, uploaded: 0, errors: [existingError.message] };

  const existingRows = (existingData ?? []) as ExistingImageRow[];
  const byId = new Map(existingRows.map((row) => [row.id, row]));

  // Resolve the plan against the rows/files we actually have.
  type Resolved =
    | { kind: "existing"; row: ExistingImageRow }
    | { kind: "new"; file: File };
  const resolved: Resolved[] = [];
  let fileCursor = 0;
  for (const entry of plan) {
    if (entry.kind === "existing") {
      const row = byId.get(entry.id);
      if (row) resolved.push({ kind: "existing", row });
    } else {
      const file = files[fileCursor];
      if (file) {
        fileCursor += 1;
        resolved.push({ kind: "new", file });
      }
    }
  }

  // Authoritative validation before touching Storage or the database.
  const validationErrors: string[] = [];
  for (const item of resolved) {
    if (item.kind !== "new") continue;
    const reason = validateProductImageFile(item.file);
    if (reason) validationErrors.push(`${item.file.name}: ${reason}`);
  }
  if (validationErrors.length > 0) {
    return { ok: false, uploaded: 0, errors: validationErrors };
  }

  // Upload new files under a product-specific, unique path.
  const uploaded: { file: File; path: string }[] = [];
  const uploadErrors: string[] = [];
  for (const item of resolved) {
    if (item.kind !== "new") continue;
    const path = buildProductImagePath(productId, item.file.type, item.file.name);
    const { error } = await bucket.upload(path, item.file, {
      contentType: item.file.type || "application/octet-stream",
      upsert: false,
      cacheControl: "31536000",
    });
    if (error) uploadErrors.push(`${item.file.name}: ${error.message}`);
    else uploaded.push({ file: item.file, path });
  }
  if (uploadErrors.length > 0) {
    if (uploaded.length > 0) await bucket.remove(uploaded.map((item) => item.path));
    return { ok: false, uploaded: 0, errors: uploadErrors };
  }

  // Final ordered gallery (existing paths + freshly uploaded ones).
  const finalRows: { storage_path: string; alt_text: string | null }[] = [];
  let uploadedCursor = 0;
  for (const item of resolved) {
    if (item.kind === "existing") {
      finalRows.push({ storage_path: item.row.storage_path, alt_text: item.row.alt_text });
    } else {
      const next = uploaded[uploadedCursor];
      uploadedCursor += 1;
      if (next) finalRows.push({ storage_path: next.path, alt_text: null });
    }
  }

  let coverIndex = input.coverIndex;
  if (!Number.isInteger(coverIndex) || coverIndex < 0 || coverIndex >= finalRows.length) {
    coverIndex = finalRows.length > 0 ? 0 : -1;
  }

  const keptIds = new Set(
    resolved.flatMap((item) => (item.kind === "existing" ? [item.row.id] : [])),
  );
  const removedPaths = existingRows
    .filter((row) => !keptIds.has(row.id))
    .map((row) => row.storage_path);

  // Rewrite the gallery: clear then insert, so the unique "one primary" index
  // is never violated by an overlapping update.
  const { error: deleteError } = await supabase
    .from("product_images")
    .delete()
    .eq("product_id", productId);
  if (deleteError) {
    if (uploaded.length > 0) await bucket.remove(uploaded.map((item) => item.path));
    return { ok: false, uploaded: 0, errors: [deleteError.message] };
  }

  if (finalRows.length > 0) {
    const { error: insertError } = await supabase.from("product_images").insert(
      finalRows.map((row, index) => ({
        product_id: productId,
        storage_path: row.storage_path,
        alt_text: row.alt_text,
        sort_order: index,
        is_primary: index === coverIndex,
      })),
    );
    if (insertError) {
      // Best-effort restore of the previous gallery, then drop new objects.
      if (existingRows.length > 0) {
        await supabase.from("product_images").insert(
          existingRows.map((row, index) => ({
            product_id: productId,
            storage_path: row.storage_path,
            alt_text: row.alt_text,
            sort_order: index,
            is_primary: false,
          })),
        );
      }
      if (uploaded.length > 0) await bucket.remove(uploaded.map((item) => item.path));
      return { ok: false, uploaded: 0, errors: [insertError.message] };
    }
  }

  // Storage cleanup for images the admin removed — never fatal.
  if (removedPaths.length > 0) await bucket.remove(removedPaths);

  return { ok: true, uploaded: uploaded.length, errors: [] };
}

/* -------------------------------------------------------------------------- */
/* taxonomy                                                                    */
/* -------------------------------------------------------------------------- */

export async function listAdminCategories(): Promise<Category[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function listAdminTags(): Promise<ProductTag[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("product_tags")
    .select("*")
    .order("kind", { ascending: true })
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export const TAG_KIND_ORDER = TAG_KINDS;
