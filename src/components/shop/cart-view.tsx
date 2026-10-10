"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, ShoppingBag, Trash2 } from "lucide-react";
import { useShop } from "@/components/shop/shop-provider";
import { ProductImage } from "@/components/commerce/product-image";
import { Quantity } from "@/components/commerce/quantity";
import { Button } from "@/components/ui/button";
import { FREE_DELIVERY_THRESHOLD } from "@/lib/constants";
import { formatEGP } from "@/lib/utils";

export function CartView() {
  const { hydrated, lines, subtotal, count, setQuantity, removeLine } = useShop();
  const router = useRouter();

  const freeRemaining = Math.max(0, FREE_DELIVERY_THRESHOLD - subtotal);
  const freeProgress = Math.min(100, Math.round((subtotal / FREE_DELIVERY_THRESHOLD) * 100));

  if (!hydrated) {
    return <div className="h-40 animate-pulse rounded-card bg-surface-muted" aria-hidden />;
  }

  if (lines.length === 0) {
    return (
      <div className="py-16">
        <EmptyCart />
      </div>
    );
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_360px] lg:items-start">
      <div className="min-w-0">
        <ul className="divide-y divide-border">
          {lines.map((line) => (
            <li key={line.key} className="flex gap-4 py-5 sm:gap-5">
              <Link
                href={`/product/${line.slug}`}
                className="shrink-0 overflow-hidden rounded-card border border-border bg-surface"
                aria-label={`${line.name} — view product`}
              >
                <ProductImage
                  path={line.imageUrl}
                  alt={line.name}
                  caption={line.name}
                  sizes="96px"
                  className="size-20 sm:size-24"
                />
              </Link>
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      href={`/product/${line.slug}`}
                      className="text-sm font-bold leading-snug text-foreground hover:text-primary sm:text-[15px]"
                    >
                      {line.name}
                    </Link>
                    <p className="mt-1 text-xs font-semibold tabular-nums">
                      {formatEGP(line.price)}
                    </p>
                    {line.isCustomizable && Object.keys(line.personalization).length > 0 ? (
                      <ul className="mt-1.5 flex flex-wrap gap-1.5">
                        {Object.entries(line.personalization).map(([key, value]) => (
                          <li
                            key={key}
                            className="rounded-pill border border-border bg-surface-muted px-2 py-0.5 text-[11px] text-muted-foreground"
                          >
                            {key}: <span className="font-semibold text-foreground">{value}</span>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeLine(line.key)}
                    className="rounded-md p-1.5 text-muted-foreground transition-colors hover:text-destructive focus-visible:outline-2 focus-visible:outline-ring"
                    aria-label={`Remove ${line.name} from cart`}
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </button>
                </div>
                <div className="mt-auto flex items-center justify-between pt-3">
                  <Quantity
                    value={line.quantity}
                    onChange={(next) => setQuantity(line.key, next)}
                    max={Math.max(1, line.maxStock)}
                    min={1}
                    size="sm"
                  />
                  <p className="text-sm font-bold tabular-nums text-foreground">
                    {formatEGP(line.price * line.quantity)}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <aside className="rounded-card border border-border bg-surface p-6 shadow-hairline lg:sticky lg:top-28">
        <h2 className="text-base font-extrabold text-foreground">Order summary</h2>
        {freeRemaining > 0 ? (
          <div className="mt-4">
            <p className="text-xs text-muted-foreground">
              Add <strong className="text-foreground">{formatEGP(freeRemaining)}</strong> more for
              free delivery
            </p>
            <div
              className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-muted"
              role="progressbar"
              aria-valuenow={freeProgress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Progress toward free delivery"
            >
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${freeProgress}%` }}
              />
            </div>
          </div>
        ) : (
          <p className="mt-3 inline-flex items-center gap-1.5 rounded-pill bg-success/10 px-2.5 py-1 text-xs font-semibold text-success">
            Free delivery unlocked
          </p>
        )}

        <dl className="mt-5 space-y-2.5 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Items ({count})</dt>
            <dd className="font-semibold tabular-nums">{formatEGP(subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Delivery</dt>
            <dd className="font-semibold tabular-nums">
              {freeRemaining > 0 ? "at checkout" : "FREE"}
            </dd>
          </div>
          <div className="flex justify-between border-t border-border pt-3">
            <dt className="font-bold text-foreground">Total</dt>
            <dd className="text-lg font-extrabold tabular-nums text-foreground">
              {formatEGP(subtotal)}
            </dd>
          </div>
        </dl>

        <Button
          className="mt-5 w-full"
          size="lg"
          onClick={() => router.push("/checkout")}
        >
          Continue to checkout
          <ArrowRight className="size-4" aria-hidden />
        </Button>
        <Link
          href="/shop"
          className="mt-3 block text-center text-xs font-semibold text-primary hover:underline"
        >
          Keep shopping
        </Link>
      </aside>
    </div>
  );
}

function EmptyCart() {
  return (
    <div className="mx-auto max-w-md text-center">
      <div className="mx-auto grid size-16 place-items-center rounded-full bg-surface-muted">
        <ShoppingBag className="size-7 text-muted-foreground" aria-hidden />
      </div>
      <h2 className="mt-5 text-xl font-extrabold text-foreground">Your cart is empty</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Discover thoughtful gifts and personalize them the way your loved ones would love.
      </p>
      <Link
        href="/shop"
        className="mt-6 inline-flex items-center gap-2 rounded-pill bg-primary px-7 py-3 text-sm font-bold text-white transition-colors hover:bg-primary/90"
      >
        Start shopping
        <ArrowRight className="size-4" aria-hidden />
      </Link>
      <p className="mt-6 text-xs text-muted-foreground">
        Free delivery on orders over {formatEGP(FREE_DELIVERY_THRESHOLD)}
      </p>
    </div>
  );
}