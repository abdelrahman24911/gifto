import { cacheLife, cacheTag } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import type { Category, CategoryStatsRow } from "@/lib/types";

function supabase() {
  return createPublicClient();
}

export interface CategoryWithCount {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_path: string | null;
  sort_order: number;
  product_count: number;
}

function toCategoryWithCount(row: CategoryStatsRow): CategoryWithCount | null {
  if (!row.id || !row.slug || !row.name) return null;
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    image_path: row.image_path,
    sort_order: row.sort_order ?? 0,
    product_count: row.product_count ?? 0,
  };
}

/** Active categories in navigation order, with live product counts. */
export async function listCategories(): Promise<CategoryWithCount[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("catalog");
  const { data, error } = await supabase()
    .from("category_stats")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) throw new Error(error.message);

  return (data ?? [])
    .map(toCategoryWithCount)
    .filter((category): category is CategoryWithCount => Boolean(category));
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  "use cache";
  cacheLife("minutes");
  cacheTag("catalog");
  const { data, error } = await supabase()
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}
