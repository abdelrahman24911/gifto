import { cacheLife, cacheTag } from "next/cache";
import { BUDGET_TIERS, DEFAULT_PAGE_SIZE } from "@/lib/constants";
import { createPublicClient } from "@/lib/supabase/public";
import type {
  ProductDetail,
  ProductImage,
  ProductOption,
  ProductOptionValue,
  ProductSummary,
} from "@/lib/types";

const PRODUCT_CARD_SELECT = `
  *,
  images:product_images(*),
  categories:product_categories(category:categories(id, name, slug)),
  tags:product_tag_relations(tag:product_tags(id, name, slug, kind))
`;

interface RawProduct extends Omit<ProductSummary, "images" | "categories" | "tags"> {
  images: ProductImage[] | null;
  categories: { category: { id: string; name: string; slug: string } | null }[] | null;
  tags: {
    tag: { id: string; name: string; slug: string; kind: ProductSummary["tags"][number]["kind"] } | null;
  }[] | null;
}

function bySortOrder<T extends { sort_order: number }>(a: T, b: T) {
  return a.sort_order - b.sort_order;
}

function toSummary(raw: RawProduct): ProductSummary {
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

function supabase() {
  return createPublicClient();
}

/* -------------------------------------------------------------------------- */
/* filters                                                                     */
/* -------------------------------------------------------------------------- */

export type ProductSort =
  | "featured"
  | "newest"
  | "price-asc"
  | "price-desc"
  | "rating"
  | "best-selling";

export interface ProductFilters {
  search?: string;
  category?: string;
  recipient?: string;
  occasion?: string;
  vibe?: string;
  budget?: string;
  minPrice?: number;
  maxPrice?: number;
  featured?: boolean;
  bestSeller?: boolean;
  customizable?: boolean;
  includeInactive?: boolean;
  sort?: ProductSort;
  page?: number;
  pageSize?: number;
}

export interface ProductListResult {
  items: ProductSummary[];
  total: number;
  page: number;
  pageCount: number;
  pageSize: number;
}

const BUDGET_TIER_MAP = new Map(BUDGET_TIERS.map((tier) => [tier.slug, tier]));

async function idsForTag(kind: string, slug: string): Promise<string[]> {
  const { data, error } = await supabase()
    .from("product_tag_relations")
    .select("product_id, tag:product_tags!inner(kind, slug)")
    .eq("tag.kind", kind)
    .eq("tag.slug", slug);

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => row.product_id);
}

function intersect(a: string[], b: string[]): string[] {
  const set = new Set(b);
  return a.filter((value) => set.has(value));
}

async function idsForCategory(slug: string): Promise<string[]> {
  const { data, error } = await supabase()
    .from("product_categories")
    .select("product_id, category:categories!inner(slug)")
    .eq("category.slug", slug);

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => row.product_id);
}

function baseProductsQuery() {
  return supabase().from("products").select(PRODUCT_CARD_SELECT, { count: "exact" });
}

type ProductsQuery = ReturnType<typeof baseProductsQuery>;

interface ResolvedFilters {
  includeInactive?: boolean;
  search?: string;
  categoryIds?: string[];
  tagIds?: string[];
  budget?: string;
  minPrice?: number;
  maxPrice?: number;
  featured?: boolean;
  bestSeller?: boolean;
  customizable?: boolean;
}

async function resolveIds(filters: ProductFilters): Promise<ResolvedFilters> {
  const resolved: ResolvedFilters = {
    includeInactive: filters.includeInactive,
    search: filters.search,
    budget: filters.budget,
    minPrice: filters.minPrice,
    maxPrice: filters.maxPrice,
    featured: filters.featured,
    bestSeller: filters.bestSeller,
    customizable: filters.customizable,
  };

  if (filters.category) resolved.categoryIds = await idsForCategory(filters.category);

  const tagFilters: [string, string][] = [];
  if (filters.recipient) tagFilters.push(["recipient", filters.recipient]);
  if (filters.occasion) tagFilters.push(["occasion", filters.occasion]);
  if (filters.vibe) tagFilters.push(["vibe", filters.vibe]);

  if (tagFilters.length > 0) {
    let ids: string[] | null = null;
    for (const [kind, slug] of tagFilters) {
      const next = await idsForTag(kind, slug);
      ids = ids === null ? next : intersect(ids, next);
      if (ids.length === 0) break;
    }
    resolved.tagIds = ids ?? [];
  }

  return resolved;
}

function applyFilters(query: ProductsQuery, filters: ResolvedFilters): ProductsQuery {
  let q = query;

  if (!filters.includeInactive) q = q.eq("is_active", true);

  if (filters.search) {
    const term = filters.search.trim().replace(/[%_,()\\]/g, " ").trim();
    if (term) q = q.or(`name.ilike.%${term}%,short_description.ilike.%${term}%`);
  }

  if (filters.categoryIds) q = q.in("id", filters.categoryIds);
  if (filters.tagIds) q = q.in("id", filters.tagIds);

  const tier = filters.budget ? BUDGET_TIER_MAP.get(filters.budget) : undefined;
  if (tier) {
    if (tier.min > 0) q = q.gte("price", tier.min);
    if (tier.max !== null) q = q.lt("price", tier.max);
  }

  if (typeof filters.minPrice === "number") q = q.gte("price", filters.minPrice);
  if (typeof filters.maxPrice === "number") q = q.lte("price", filters.maxPrice);
  if (filters.featured) q = q.eq("is_featured", true);
  if (filters.bestSeller) q = q.eq("is_best_seller", true);
  if (filters.customizable) q = q.eq("is_customizable", true);

  return q;
}

function applySort(query: ProductsQuery, sort: ProductSort | undefined): ProductsQuery {
  switch (sort) {
    case "price-asc":
      return query.order("price", { ascending: true }) as ProductsQuery;
    case "price-desc":
      return query.order("price", { ascending: false }) as ProductsQuery;
    case "newest":
      return query.order("created_at", { ascending: false }) as ProductsQuery;
    case "rating":
      return query
        .order("rating", { ascending: false })
        .order("reviews_count", { ascending: false }) as ProductsQuery;
    case "best-selling":
      return query
        .order("is_best_seller", { ascending: false })
        .order("rating", { ascending: false }) as ProductsQuery;
    default:
      return query
        .order("is_featured", { ascending: false })
        .order("is_best_seller", { ascending: false })
        .order("rating", { ascending: false }) as ProductsQuery;
  }
}

export async function listProducts(filters: ProductFilters = {}): Promise<ProductListResult> {
  'use cache'
  cacheLife("minutes")
  cacheTag("catalog")
  const pageSize = filters.pageSize ?? DEFAULT_PAGE_SIZE;
  const resolved = await resolveIds(filters);

  const { count, error: countError } = await applyFilters(baseProductsQuery(), resolved).limit(0);
  if (countError) throw new Error(countError.message);

  const total = count ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(Math.max(1, filters.page ?? 1), pageCount);
  const from = (page - 1) * pageSize;

  const { data, error } = await applySort(
    applyFilters(baseProductsQuery(), resolved),
    filters.sort,
  ).range(from, from + pageSize - 1);
  if (error) throw new Error(error.message);

  return {
    items: (data ?? []).map((row) => toSummary(row as unknown as RawProduct)),
    total,
    page,
    pageCount,
    pageSize,
  };
}

/* -------------------------------------------------------------------------- */
/* single / grouped reads                                                      */
/* -------------------------------------------------------------------------- */

export async function getProductBySlug(slug: string): Promise<ProductDetail | null> {
  'use cache'
  cacheLife("minutes")
  cacheTag("catalog")
  const { data, error } = await supabase()
    .from("products")
    .select(`${PRODUCT_CARD_SELECT}, options:product_options(*, values:product_option_values(*))`)
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  const raw = data as unknown as RawProduct & {
    options: (ProductOption & { values: ProductOptionValue[] | null })[] | null;
  };

  const summary = toSummary(raw);
  const options = [...(raw.options ?? [])]
    .sort(bySortOrder)
    .map((option) => ({
      ...option,
      values: [...(option.values ?? [])].sort(bySortOrder),
    }));

  return { ...summary, options, related: await getRelatedProducts(summary) };
}

export async function getProductsByIds(ids: string[]): Promise<ProductSummary[]> {
  'use cache'
  cacheLife("minutes")
  cacheTag("catalog")
  if (ids.length === 0) return [];
  const { data, error } = await supabase()
    .from("products")
    .select(PRODUCT_CARD_SELECT)
    .in("id", ids);

  if (error) throw new Error(error.message);
  const byId = new Map(
    (data ?? []).map((row) => [row.id, toSummary(row as unknown as RawProduct)]),
  );
  return ids.map((id) => byId.get(id)).filter((product): product is ProductSummary => Boolean(product));
}

async function featuredQuery(limit: number, flag: "is_featured" | "is_best_seller") {
  'use cache'
  cacheLife("minutes")
  cacheTag("catalog")
  const { data, error } = await supabase()
    .from("products")
    .select(PRODUCT_CARD_SELECT)
    .eq("is_active", true)
    .eq(flag, true)
    .order("rating", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => toSummary(row as unknown as RawProduct));
}

export const getFeaturedProducts = (limit = 8) => featuredQuery(limit, "is_featured");
export const getBestSellers = (limit = 8) => featuredQuery(limit, "is_best_seller");

export async function getRelatedProducts(product: ProductSummary): Promise<ProductSummary[]> {
  const categoryIds = product.categories.map((category) => category.id);
  if (categoryIds.length === 0) return [];

  const { data, error } = await supabase()
    .from("product_categories")
    .select("product_id")
    .in("category_id", categoryIds)
    .neq("product_id", product.id);

  if (error) throw new Error(error.message);

  const ids = [...new Set((data ?? []).map((row) => row.product_id))].slice(0, 12);
  const products = await getProductsByIds(ids);
  return products.filter((candidate) => candidate.is_active).slice(0, 4);
}

/** Resolves one product per budget tier for the homepage "Gifts by budget" section. */
export async function getBudgetProducts(): Promise<Record<string, ProductSummary[]>> {
  'use cache'
  cacheLife("minutes")
  cacheTag("catalog")
  const { data, error } = await supabase()
    .from("products")
    .select(PRODUCT_CARD_SELECT)
    .eq("is_active", true)
    .order("rating", { ascending: false })
    .limit(60);

  if (error) throw new Error(error.message);
  const products = (data ?? []).map((row) => toSummary(row as unknown as RawProduct));

  const out: Record<string, ProductSummary[]> = {};
  for (const tier of BUDGET_TIERS) {
    out[tier.slug] = products
      .filter(
        (product) =>
          product.price >= tier.min && (tier.max === null || product.price < tier.max),
      )
      .slice(0, 4);
  }
  return out;
}

/** Live stock for one product — never cached, used by the PDP and cart validation. */
export async function getProductStock(
  productIds: string[],
): Promise<Record<string, { stock_quantity: number; is_active: boolean }>> {
  if (productIds.length === 0) return {};
  const { data, error } = await supabase()
    .from("products")
    .select("id, stock_quantity, is_active")
    .in("id", productIds);

  if (error) throw new Error(error.message);
  return Object.fromEntries(
    (data ?? []).map((row) => [
      row.id,
      { stock_quantity: row.stock_quantity, is_active: row.is_active },
    ]),
  );
}

/**
 * Live name/price/stock snapshot for checkout validation. Never cached —
 * totals and stock are recomputed at order time, never trusted from the client.
 */
export async function getCheckoutLines(
  productIds: string[],
): Promise<
  Record<string, { name: string; price: number; stock_quantity: number; is_active: boolean }>
> {
  if (productIds.length === 0) return {};
  const { data, error } = await supabase()
    .from("products")
    .select("id, name, price, stock_quantity, is_active")
    .in("id", productIds);

  if (error) throw new Error(error.message);
  return Object.fromEntries(
    (data ?? []).map((row) => [
      row.id,
      {
        name: row.name,
        price: row.price,
        stock_quantity: row.stock_quantity,
        is_active: row.is_active,
      },
    ]),
  );
}
