"use client";

import * as React from "react";
import Link from "next/link";
import { HeartOff, ShoppingBag } from "lucide-react";
import { useShop } from "@/components/shop/shop-provider";
import { ProductCard } from "@/components/commerce/product-card";
import type { ProductSummary } from "@/lib/types";

export function WishlistView() {
  const { hydrated, wishlist, toggleWishlist } = useShop();
  const [products, setProducts] = React.useState<ProductSummary[] | null>(null);

  const wishlistKey = hydrated ? wishlist.join(",") : "";

  React.useEffect(() => {
    if (!wishlistKey) {
      const timer = setTimeout(() => setProducts([]), 0);
      return () => clearTimeout(timer);
    }
    let alive = true;
    fetch(`/api/products/ids?${wishlist.map((id) => `id=${encodeURIComponent(id)}`).join("&")}`)
      .then((res) => res.json())
      .then((data: { items: ProductSummary[] }) => {
        if (alive) setProducts(data.items);
      })
      .catch(() => {
        if (alive) setProducts([]);
      });
    return () => {
      alive = false;
    };
    // wishlistKey covers the ids — the array identity changes every snapshot.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wishlistKey]);

  if (!hydrated) {
    return <div className="h-40 animate-pulse rounded-card bg-surface-muted" aria-hidden />;
  }

  if (products === null) {
    return (
      <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-5 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="aspect-square animate-pulse rounded-card bg-surface-muted" />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="mx-auto max-w-md py-10 text-center">
        <div className="mx-auto grid size-16 place-items-center rounded-full bg-surface-muted">
          <HeartOff className="size-7 text-muted-foreground" aria-hidden />
        </div>
        <h2 className="mt-5 text-xl font-extrabold text-foreground">No saved gifts yet</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Tap the heart on any product to keep it here for later.
        </p>
        <Link
          href="/shop"
          className="mt-6 inline-flex items-center gap-2 rounded-pill bg-primary px-7 py-3 text-sm font-bold text-white transition-colors hover:bg-primary/90"
        >
          <ShoppingBag className="size-4" aria-hidden />
          Explore gifts
        </Link>
      </div>
    );
  }

  return (
    <div>
      <ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-5 lg:grid-cols-4">
        {products.map((product) => (
          <li key={product.id} className="relative">
            <ProductCard product={product} />
            <button
              type="button"
              onClick={() => toggleWishlist(product.id)}
              className="absolute right-3 top-3 z-10 rounded-pill bg-surface/80 px-2.5 py-1 text-[11px] font-bold text-primary backdrop-blur transition-colors hover:bg-surface"
              aria-label={`Remove ${product.name} from wishlist`}
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}