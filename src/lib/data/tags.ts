import { cacheLife, cacheTag } from "next/cache";
import { TAG_KINDS } from "@/lib/constants";
import { createPublicClient } from "@/lib/supabase/public";
import type { TagKind, TagStatsRow } from "@/lib/types";

function supabase() {
  return createPublicClient();
}

export interface FacetTag {
  id: string;
  name: string;
  slug: string;
  kind: TagKind;
  sort_order: number;
  product_count: number;
}

function toFacetTag(row: TagStatsRow): FacetTag | null {
  if (!row.id || !row.name || !row.slug || !row.kind) return null;
  if (!TAG_KINDS.includes(row.kind as TagKind)) return null;
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    kind: row.kind as TagKind,
    sort_order: row.sort_order ?? 0,
    product_count: row.product_count ?? 0,
  };
}

/** All facet tags grouped by kind, ordered for the gift finder and shop filters. */
export async function getFacetsByKind(): Promise<Record<TagKind, FacetTag[]>> {
  "use cache";
  cacheLife("minutes");
  cacheTag("catalog");
  const { data, error } = await supabase()
    .from("tag_stats")
    .select("*")
    .order("kind", { ascending: true })
    .order("sort_order", { ascending: true });

  if (error) throw new Error(error.message);

  const out = Object.fromEntries(TAG_KINDS.map((kind) => [kind, [] as FacetTag[]])) as Record<
    TagKind,
    FacetTag[]
  >;

  for (const row of data ?? []) {
    const tag = toFacetTag(row);
    if (tag) out[tag.kind].push(tag);
  }

  return out;
}

export async function getTagsByKind(kind: TagKind): Promise<FacetTag[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("catalog");
  const facets = await getFacetsByKind();
  return facets[kind];
}
