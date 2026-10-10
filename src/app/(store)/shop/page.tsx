import type { Metadata } from "next";
import Link from "next/link";
import { PackageSearch } from "lucide-react";
import { BUDGET_TIERS, BRAND } from "@/lib/constants";
import { listCategories } from "@/lib/data/categories";
import { getFacetsByKind } from "@/lib/data/tags";
import { listProducts, type ProductSort } from "@/lib/data/products";
import {
  activeChips,
  activeFilterCount,
  CLEAR_ALL_HREF,
  parseShopParams,
  shopHref,
  shopParams,
} from "@/lib/shop-params";
import { ProductCard, ProductGrid } from "@/components/commerce/product-card";
import { FilterPanel } from "@/components/shop/filter-panel";
import { FiltersButton, SortSelect } from "@/components/shop/sort-select";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { Section } from "@/components/ui/section";

export const instant = false;

interface ShopPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ searchParams }: ShopPageProps): Promise<Metadata> {
  const params = parseShopParams(await searchParams);
  const heading = await resolveHeading(params);

  return {
    title: `${heading} · ${BRAND.name} — Gifts in Egypt`,
    description: `Browse ${heading.toLowerCase()} gifts, wrapped and delivered across Egypt.`,
  };
}

async function resolveHeading(params: ReturnType<typeof parseShopParams>) {
  if (params.q) return `Results for “${params.q}”`;
  if (params.budget) {
    return BUDGET_TIERS.find((tier) => tier.slug === params.budget)?.label ?? "Gifts by budget";
  }
  if (params.category) {
    const categories = await listCategories();
    return categories.find((category) => category.slug === params.category)?.name ?? "All gifts";
  }
  for (const kind of ["recipient", "occasion", "vibe"] as const) {
    const slug = params[kind];
    if (!slug) continue;
    const facets = await getFacetsByKind();
    const match = facets[kind].find((tag) => tag.slug === slug);
    if (match) return match.name;
  }
  return "All gifts";
}

function sanitize(
  params: ReturnType<typeof parseShopParams>,
  categories: Awaited<ReturnType<typeof listCategories>>,
  facets: Awaited<ReturnType<typeof getFacetsByKind>>,
): ReturnType<typeof parseShopParams> {
  const knownCategories = new Set(categories.map((category) => category.slug));
  const knownTags = new Set(
    [...facets.recipient, ...facets.occasion, ...facets.vibe].map((tag) => tag.slug),
  );
  const knownBudgets = new Set(BUDGET_TIERS.map((tier) => tier.slug));

  return {
    ...params,
    category: knownCategories.has(params.category) ? params.category : "",
    recipient: knownTags.has(params.recipient) ? params.recipient : "",
    occasion: knownTags.has(params.occasion) ? params.occasion : "",
    vibe: knownTags.has(params.vibe) ? params.vibe : "",
    budget: knownBudgets.has(params.budget) ? params.budget : "",
  };
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const requested = parseShopParams(await searchParams);

  const [categories, facets] = await Promise.all([listCategories(), getFacetsByKind()]);
  const params = sanitize(requested, categories, facets);

  const result = await listProducts({
    search: params.q || undefined,
    category: params.category || undefined,
    recipient: params.recipient || undefined,
    occasion: params.occasion || undefined,
    vibe: params.vibe || undefined,
    budget: params.budget || undefined,
    sort: params.sort as ProductSort,
    page: params.page,
  });

  const heading = await resolveHeading(params);
  const labels = {
    categories: Object.fromEntries(categories.map((category) => [category.slug, category.name])),
    tags: Object.fromEntries(
      [...facets.recipient, ...facets.occasion, ...facets.vibe].map((tag) => [tag.slug, tag.name]),
    ),
  };
  const chips = activeChips(params, labels);
  const activeCount = activeFilterCount(params);

  const hrefFor = (page: number) => shopHref(shopParams(params, { page }));
  const panel = (
    <FilterPanel params={params} categories={categories} facets={facets} />
  );

  return (
    <Section className="py-10 sm:py-12">
      <nav aria-label="Breadcrumb" className="eyebrow mb-4 text-muted-foreground">
        <Link href="/" className="hover:text-primary">
          Home
        </Link>
        <span className="mx-2" aria-hidden>
          /
        </span>
        <span className="text-foreground">{heading}</span>
      </nav>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-title font-extrabold tracking-tight">{heading}</h1>
          <p className="mt-2 text-sm text-muted-foreground" aria-live="polite">
            {result.total === 0
              ? "No gifts match these filters."
              : `${result.total} ${result.total === 1 ? "gift" : "gifts"} · page ${result.page} of ${result.pageCount}`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden lg:block">
            <SortSelect value={params.sort} />
          </div>
          <div className="lg:hidden">
            <FiltersButton activeCount={activeCount} panel={panel} />
          </div>
        </div>
      </div>

      {chips.length > 0 ? (
        <ul className="mt-5 flex flex-wrap items-center gap-2">
          {chips.map((chip) => (
            <li key={chip.key}>
              <Link
                href={chip.href}
                className="inline-flex items-center gap-1.5 rounded-pill border border-primary/30 bg-primary-soft px-3 py-1.5 text-xs font-bold text-primary transition-colors hover:border-primary/60"
              >
                {chip.label}
                <span aria-hidden>×</span>
                <span className="sr-only">Remove filter</span>
              </Link>
            </li>
          ))}
          <li>
            <Link
              href={CLEAR_ALL_HREF}
              className="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-bold text-muted-foreground transition-colors hover:text-primary"
            >
              Clear all
            </Link>
          </li>
        </ul>
      ) : null}

      <div className="mt-8 grid gap-8 lg:grid-cols-[240px_1fr] lg:gap-10">
        <aside className="hidden lg:block">
          <div className="sticky top-32 rounded-card border border-border bg-surface p-5 shadow-hairline">
            <p className="eyebrow mb-5 text-muted-foreground">Refine</p>
            {panel}
          </div>
        </aside>

        <div>
          <div className="mb-6 flex items-center justify-between gap-4 lg:hidden">
            <p className="text-sm text-muted-foreground">Sort</p>
            <div className="min-w-52">
              <SortSelect value={params.sort} />
            </div>
          </div>

          {result.items.length > 0 ? (
            <>
              <ProductGrid cols={3}>
                {result.items.map((product, index) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    priority={index < 4}
                    sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"
                  />
                ))}
              </ProductGrid>

              <Pagination
                page={result.page}
                pageCount={result.pageCount}
                hrefFor={hrefFor}
                className="mt-12"
              />
            </>
          ) : (
            <EmptyState
              icon={<PackageSearch className="size-7" aria-hidden />}
              title="Nothing matches — yet"
              description={
                chips.length > 0
                  ? "Try removing a filter or two. There are plenty of other gifts waiting."
                  : "We have nothing in this section right now. Browse everything instead."
              }
              action={
                <div className="flex flex-wrap justify-center gap-2">
                  {chips.length > 0 ? (
                    <Link
                      href={CLEAR_ALL_HREF}
                      className="inline-flex h-11 items-center rounded-pill border border-border-strong px-5 text-sm font-bold transition-colors hover:border-foreground/30"
                    >
                      Clear filters
                    </Link>
                  ) : null}
                  <Link
                    href="/gift-finder"
                    className="inline-flex h-11 items-center rounded-pill bg-primary px-5 text-sm font-bold text-white transition-colors hover:bg-primary-hover"
                  >
                    Try the gift finder
                  </Link>
                </div>
              }
            />
          )}
        </div>
      </div>
    </Section>
  );
}
