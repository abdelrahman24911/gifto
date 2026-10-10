import { BUDGET_TIERS } from "@/lib/constants";
import type { ProductSort } from "@/lib/data/products";

export const SORT_OPTIONS: { value: ProductSort; label: string }[] = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "Newest" },
  { value: "best-selling", label: "Best selling" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "rating", label: "Top rated" },
];

const SORT_VALUES = new Set<string>(SORT_OPTIONS.map((option) => option.value));

export interface ShopParams {
  q: string;
  category: string;
  recipient: string;
  occasion: string;
  vibe: string;
  budget: string;
  sort: ProductSort;
  page: number;
}

type RawValue = string | string[] | undefined;

function first(value: RawValue): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export function parseShopParams(raw: Record<string, RawValue>): ShopParams {
  const sort = first(raw.sort);
  const page = Number.parseInt(first(raw.page), 10);

  return {
    q: first(raw.q).trim(),
    category: first(raw.category),
    recipient: first(raw.recipient),
    occasion: first(raw.occasion),
    vibe: first(raw.vibe),
    budget: first(raw.budget),
    sort: SORT_VALUES.has(sort) ? (sort as ProductSort) : "featured",
    page: Number.isFinite(page) && page > 0 ? page : 1,
  };
}

/** Params minus pagination — used by filter links so changing a filter returns to page 1. */
export function shopParams(params: ShopParams, patch: Partial<ShopParams> = {}): ShopParams {
  return { ...params, page: 1, ...patch };
}

export function shopHref(params: Partial<ShopParams> = {}): string {
  const search = new URLSearchParams();

  const entries: [string, string][] = [
    ["q", params.q ?? ""],
    ["category", params.category ?? ""],
    ["recipient", params.recipient ?? ""],
    ["occasion", params.occasion ?? ""],
    ["vibe", params.vibe ?? ""],
    ["budget", params.budget ?? ""],
    ["sort", params.sort && params.sort !== "featured" ? params.sort : ""],
    ["page", params.page && params.page > 1 ? String(params.page) : ""],
  ];

  for (const [key, value] of entries) {
    if (value) search.set(key, value);
  }

  const query = search.toString();
  return query ? `/shop?${query}` : "/shop";
}

export interface FilterChip {
  key: keyof ShopParams;
  label: string;
  href: string;
}

export function activeChips(
  params: ShopParams,
  labels: { categories: Record<string, string>; tags: Record<string, string> },
): FilterChip[] {
  const chips: FilterChip[] = [];

  if (params.q) chips.push({ key: "q", label: `“${params.q}”`, href: shopHref(shopParams(params, { q: "" })) });

  if (params.category) {
    chips.push({
      key: "category",
      label: labels.categories[params.category] ?? params.category,
      href: shopHref(shopParams(params, { category: "" })),
    });
  }

  for (const kind of ["recipient", "occasion", "vibe"] as const) {
    const slug = params[kind];
    if (!slug) continue;
    chips.push({
      key: kind,
      label: labels.tags[slug] ?? slug,
      href: shopHref(shopParams(params, { [kind]: "" })),
    });
  }

  if (params.budget) {
    const tier = BUDGET_TIERS.find((candidate) => candidate.slug === params.budget);
    chips.push({
      key: "budget",
      label: tier?.label ?? params.budget,
      href: shopHref(shopParams(params, { budget: "" })),
    });
  }

  return chips;
}

export const CLEAR_ALL_HREF = "/shop";

export function activeFilterCount(params: ShopParams): number {
  return [params.q, params.category, params.recipient, params.occasion, params.vibe, params.budget]
    .filter(Boolean).length;
}
