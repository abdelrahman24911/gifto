import Link from "next/link";
import { Check, X } from "lucide-react";
import { BUDGET_TIERS } from "@/lib/constants";
import type { TagKind } from "@/lib/types";
import type { CategoryWithCount } from "@/lib/data/categories";
import type { FacetTag } from "@/lib/data/tags";
import { cn } from "@/lib/utils";
import { shopHref, shopParams, type ShopParams } from "@/lib/shop-params";

export interface FilterPanelProps {
  params: ShopParams;
  categories: CategoryWithCount[];
  facets: Record<TagKind, FacetTag[]>;
  onNavigate?: () => void;
  className?: string;
}

export function FilterPanel({
  params,
  categories,
  facets,
  onNavigate,
  className,
}: FilterPanelProps) {
  return (
    <div className={cn("space-y-7", className)}>
      <FilterGroup title="Category" active={params.category !== ""}>
        {categories.map((category) => (
          <FilterRow
            key={category.slug}
            label={category.name}
            count={category.product_count}
            selected={params.category === category.slug}
            href={shopHref(
              shopParams(params, {
                category: params.category === category.slug ? "" : category.slug,
              }),
            )}
            onNavigate={onNavigate}
          />
        ))}
      </FilterGroup>

      <FilterGroup title="Who is it for?" active={params.recipient !== ""}>
        {facets.recipient.map((tag) => (
          <FilterRow
            key={tag.slug}
            label={tag.name}
            count={tag.product_count}
            selected={params.recipient === tag.slug}
            href={shopHref(
              shopParams(params, { recipient: params.recipient === tag.slug ? "" : tag.slug }),
            )}
            onNavigate={onNavigate}
          />
        ))}
      </FilterGroup>

      <FilterGroup title="Occasion" active={params.occasion !== ""}>
        {facets.occasion.map((tag) => (
          <FilterRow
            key={tag.slug}
            label={tag.name}
            count={tag.product_count}
            selected={params.occasion === tag.slug}
            href={shopHref(
              shopParams(params, { occasion: params.occasion === tag.slug ? "" : tag.slug }),
            )}
            onNavigate={onNavigate}
          />
        ))}
      </FilterGroup>

      <FilterGroup title="Vibe" active={params.vibe !== ""}>
        {facets.vibe.map((tag) => (
          <FilterRow
            key={tag.slug}
            label={tag.name}
            count={tag.product_count}
            selected={params.vibe === tag.slug}
            href={shopHref(
              shopParams(params, { vibe: params.vibe === tag.slug ? "" : tag.slug }),
            )}
            onNavigate={onNavigate}
          />
        ))}
      </FilterGroup>

      <FilterGroup title="Budget" active={params.budget !== ""}>
        {BUDGET_TIERS.map((tier) => (
          <FilterRow
            key={tier.slug}
            label={tier.label}
            selected={params.budget === tier.slug}
            href={shopHref(
              shopParams(params, { budget: params.budget === tier.slug ? "" : tier.slug }),
            )}
            onNavigate={onNavigate}
          />
        ))}
      </FilterGroup>

      <Link
        href="/shop"
        className="inline-flex items-center gap-1.5 text-sm font-bold text-primary transition-colors hover:text-primary-hover"
      >
        <X className="size-4" aria-hidden />
        Clear all filters
      </Link>
    </div>
  );
}

function FilterGroup({
  title,
  active,
  children,
}: {
  title: string;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <fieldset>
      <legend
        className={cn(
          "eyebrow mb-3 flex items-center gap-2 text-muted-foreground",
          active && "text-primary",
        )}
      >
        {title}
        {active ? <span className="size-1.5 rounded-full bg-primary" aria-hidden /> : null}
      </legend>
      <ul className="space-y-0.5">{children}</ul>
    </fieldset>
  );
}

function FilterRow({
  label,
  count,
  selected,
  href,
  onNavigate,
}: {
  label: string;
  count?: number;
  selected: boolean;
  href: string;
  onNavigate?: () => void;
}) {
  return (
    <li>
      <Link
        href={href}
        onClick={onNavigate}
        aria-current={selected ? "true" : undefined}
        className={cn(
          "group flex items-center justify-between gap-3 rounded-md px-2.5 py-2 text-sm transition-colors",
          selected
            ? "bg-primary-soft font-bold text-primary"
            : "text-muted-foreground hover:bg-muted hover:text-foreground",
        )}
      >
        <span className="flex min-w-0 items-center gap-2.5">
          <span
            aria-hidden
            className={cn(
              "grid size-4 shrink-0 place-items-center rounded-[5px] border transition-colors",
              selected ? "border-primary bg-primary text-white" : "border-border-strong bg-surface",
            )}
          >
            {selected ? <Check className="size-3" strokeWidth={3} /> : null}
          </span>
          <span className="truncate">{label}</span>
        </span>
        {typeof count === "number" ? (
          <span className="text-xs tabular-nums text-muted-foreground/70">{count}</span>
        ) : null}
      </Link>
    </li>
  );
}
