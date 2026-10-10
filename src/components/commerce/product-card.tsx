import Link from "next/link";
import { cn, truncate } from "@/lib/utils";
import type { ProductSummary } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Price } from "@/components/commerce/price";
import { Rating } from "@/components/commerce/rating";
import { ProductImage } from "@/components/commerce/product-image";

export interface ProductCardProps {
  product: ProductSummary;
  /** Passed straight to `<Image fill sizes>` — set per layout. */
  sizes?: string;
  priority?: boolean;
  className?: string;
  /** Hide the category eyebrow above the title. */
  hideCategory?: boolean;
}

export function ProductCard({
  product,
  sizes = "(max-width: 768px) 50vw, 33vw",
  priority,
  className,
  hideCategory,
}: ProductCardProps) {
  const soldOut = product.stock_quantity <= 0;
  const category = product.categories[0];

  return (
    <article className={cn("group relative", className)}>
      <Link
        href={`/product/${product.slug}`}
        className="block rounded-card focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
        aria-label={`${product.name}, ${product.price} EGP`}
      >
        <div className="relative overflow-hidden rounded-card border border-border bg-surface shadow-hairline transition-shadow duration-200 group-hover:shadow-card">
          <ProductImage
            path={product.images[0]?.storage_path ?? null}
            alt={product.images[0]?.alt_text ?? product.name}
            caption={product.name}
            sizes={sizes}
            priority={priority}
            className="aspect-square w-full transition-transform duration-300 group-hover:scale-[1.03]"
          />

          <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
            {soldOut ? (
              <Badge variant="destructive">Sold out</Badge>
            ) : product.is_best_seller ? (
              <Badge variant="primary">Best seller</Badge>
            ) : product.is_featured ? (
              <Badge variant="accent">Featured</Badge>
            ) : null}
            {!soldOut && product.stock_quantity <= product.low_stock_threshold ? (
              <Badge variant="warning">Low stock</Badge>
            ) : null}
          </div>

          {!soldOut && product.compare_at_price ? (
            <span className="absolute right-3 top-3 rounded-pill bg-foreground/85 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur">
              Sale
            </span>
          ) : null}
        </div>

        <div className="mt-3.5 px-0.5">
          {!hideCategory && category ? (
            <p className="eyebrow text-muted-foreground">{category.name}</p>
          ) : null}
          <h3 className="mt-1.5 line-clamp-2 text-sm font-bold leading-snug text-foreground transition-colors group-hover:text-primary sm:text-[15px]">
            {product.name}
          </h3>
          {product.short_description ? (
            <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
              {truncate(product.short_description, 70)}
            </p>
          ) : null}

          <div className="mt-2.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
            <Price value={product.price} compareAt={product.compare_at_price} size="sm" />
            <Rating value={product.rating} count={product.reviews_count} showValue={false} />
          </div>
        </div>
      </Link>
    </article>
  );
}

export function ProductGrid({
  children,
  className,
  cols = 3,
}: {
  children: React.ReactNode;
  className?: string;
  cols?: 2 | 3 | 4;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-5",
        cols === 3 && "lg:grid-cols-3 xl:grid-cols-4",
        cols === 4 && "md:grid-cols-3 xl:grid-cols-4",
        cols === 2 && "lg:grid-cols-2",
        className,
      )}
    >
      {children}
    </div>
  );
}
