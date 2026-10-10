"use client";

import * as React from "react";
import { Heart, MessageCircle, PackageCheck, RotateCcw, ShieldCheck, ShoppingBag, Truck } from "lucide-react";
import { BRAND } from "@/lib/constants";
import { storageUrl, BUCKETS } from "@/lib/storage";
import type { ProductOption, ProductOptionValue } from "@/lib/types";
import { cn, formatEGP } from "@/lib/utils";
import { useShop } from "@/components/shop/shop-provider";
import { toast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Quantity } from "@/components/commerce/quantity";

export interface BuyBoxProduct {
  id: string;
  slug: string;
  name: string;
  price: number;
  compare_at_price: number | null;
  stock_quantity: number;
  low_stock_threshold: number;
  is_customizable: boolean;
  primary_image_path: string | null;
  options: (ProductOption & { values: ProductOptionValue[] })[];
}

const trust = [
  { icon: Truck, text: "Same-day in Cairo & Giza · 1–3 days nationwide" },
  { icon: PackageCheck, text: "Wrapped by hand with a handwritten card" },
  { icon: ShieldCheck, text: "Cash on delivery, card or wallet" },
  { icon: RotateCcw, text: "7-day returns on unopened gifts" },
];

export function BuyBox({ product }: { product: BuyBoxProduct }) {
  const { addItem, toggleWishlist, isWishlisted } = useShop();
  const [choices, setChoices] = React.useState<Record<string, string>>({});
  const [entries, setEntries] = React.useState<Record<string, string>>({});
  const [quantity, setQuantity] = React.useState(1);
  const [attempted, setAttempted] = React.useState(false);

  const soldOut = product.stock_quantity <= 0;
  const lowStock = !soldOut && product.stock_quantity <= product.low_stock_threshold;
  const wished = isWishlisted(product.id);
  const max = Math.max(1, product.stock_quantity);

  const requiredMissing = product.options.filter(
    (option) =>
      option.is_required &&
      (option.type === "select"
        ? !choices[option.id]
        : !(entries[option.id] ?? "").trim()),
  );

  const handleAdd = () => {
    setAttempted(true);
    if (requiredMissing.length > 0) {
      toast.error(
        "Almost there",
        `${requiredMissing.map((option) => option.name).join(", ")} is required.`,
      );
      return;
    }

    const personalization: Record<string, string> = {};
    for (const option of product.options) {
      if (option.type === "select") {
        const value = choices[option.id];
        if (value) personalization[option.name] = value;
      } else {
        const value = (entries[option.id] ?? "").trim();
        if (value) personalization[option.name] = value;
      }
    }

    addItem(
      {
        product,
        imageUrl: storageUrl(BUCKETS.products, product.primary_image_path),
        personalization,
      },
      quantity,
    );

    toast.success(
      "Added to cart",
      `${product.name}${quantity > 1 ? ` × ${quantity}` : ""} · ${formatEGP(product.price * quantity)}`,
    );
    setAttempted(false);
  };

  return (
    <div className="mt-7 space-y-7">
      <div className="flex flex-wrap items-center gap-3">
        {soldOut ? (
          <Badge variant="destructive">Sold out</Badge>
        ) : lowStock ? (
          <Badge variant="warning">
            Only {product.stock_quantity} left
          </Badge>
        ) : (
          <Badge variant="success">In stock</Badge>
        )}
        {product.is_customizable ? <Badge variant="primary">Personalised</Badge> : null}
      </div>

      {product.options.length > 0 ? (
        <div className="space-y-6">
          {product.options.map((option) => {
            const errorId = `buybox-error-${option.id}`;
            const showError =
              attempted &&
              option.is_required &&
              (option.type === "select"
                ? !choices[option.id]
                : !(entries[option.id] ?? "").trim());

            if (option.type === "select") {
              return (
                <fieldset key={option.id}>
                  <legend className="text-sm font-bold text-foreground">
                    {option.name}
                    {option.is_required ? (
                      <span className="ml-1.5 text-primary" aria-hidden>
                        *
                      </span>
                    ) : (
                      <span className="ml-1.5 text-xs font-medium text-muted-foreground">
                        Optional
                      </span>
                    )}
                  </legend>
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {option.values.map((value) => {
                      const selected = choices[option.id] === value.value;
                      return (
                        <button
                          key={value.id}
                          type="button"
                          aria-pressed={selected}
                          onClick={() =>
                            setChoices((current) => ({ ...current, [option.id]: value.value }))
                          }
                          className={cn(
                            "rounded-pill border px-4 py-2 text-sm font-semibold transition-colors",
                            selected
                              ? "border-primary bg-primary-soft text-primary"
                              : "border-border-strong bg-surface text-foreground hover:border-foreground/30",
                          )}
                        >
                          {value.value}
                        </button>
                      );
                    })}
                  </div>
                  {showError ? (
                    <p id={errorId} className="mt-2 text-xs font-semibold text-destructive">
                      Choose {option.name.toLowerCase()} to continue.
                    </p>
                  ) : null}
                </fieldset>
              );
            }

            const isLong = option.type === "personalization";
            return (
              <div key={option.id}>
                <label
                  htmlFor={`buybox-${option.id}`}
                  className="text-sm font-bold text-foreground"
                >
                  {option.name}
                  {option.is_required ? (
                    <span className="ml-1.5 text-primary" aria-hidden>
                      *
                    </span>
                  ) : (
                    <span className="ml-1.5 text-xs font-medium text-muted-foreground">
                      Optional
                    </span>
                  )}
                </label>
                {isLong ? (
                  <textarea
                    id={`buybox-${option.id}`}
                    rows={3}
                    maxLength={240}
                    value={entries[option.id] ?? ""}
                    onChange={(event) =>
                      setEntries((current) => ({ ...current, [option.id]: event.target.value }))
                    }
                    aria-invalid={showError || undefined}
                    aria-describedby={showError ? errorId : undefined}
                    placeholder="Write something they will smile at…"
                    className="mt-2 w-full rounded-card border border-border bg-surface px-4 py-3 text-sm leading-relaxed placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none"
                  />
                ) : (
                  <input
                    id={`buybox-${option.id}`}
                    type="text"
                    maxLength={60}
                    value={entries[option.id] ?? ""}
                    onChange={(event) =>
                      setEntries((current) => ({ ...current, [option.id]: event.target.value }))
                    }
                    aria-invalid={showError || undefined}
                    aria-describedby={showError ? errorId : undefined}
                    placeholder="Type it exactly as they spell it"
                    className="mt-2 h-11 w-full rounded-card border border-border bg-surface px-4 text-sm placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none"
                  />
                )}
                {showError ? (
                  <p id={errorId} className="mt-2 text-xs font-semibold text-destructive">
                    {option.name} is required.
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <Quantity
          value={quantity}
          onChange={setQuantity}
          min={1}
          max={soldOut ? 1 : max}
          disabled={soldOut}
        />
        <Button
          size="lg"
          className="flex-1 sm:flex-none sm:min-w-56"
          onClick={handleAdd}
          disabled={soldOut}
          aria-describedby="buybox-stock"
        >
          <ShoppingBag className="size-5" aria-hidden />
          {soldOut ? "Sold out" : `Add to cart · ${formatEGP(product.price * quantity)}`}
        </Button>
        <Button
          variant="outline"
          size="lg"
          onClick={() => toggleWishlist(product.id)}
          aria-pressed={wished}
          aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart className={cn("size-5", wished && "fill-destructive text-destructive")} aria-hidden />
        </Button>
      </div>

      <p id="buybox-stock" className="text-sm text-muted-foreground">
        {soldOut
          ? "This one is out of stock right now — try the gift finder for an alternative."
          : lowStock
            ? `Only ${product.stock_quantity} left. Order today and we will wrap it tonight.`
            : `${product.stock_quantity} in stock · dispatched within 24 hours.`}
      </p>

      <ul className="grid gap-3 border-t border-border pt-6 sm:grid-cols-2">
        {trust.map(({ icon: Icon, text }) => (
          <li key={text} className="flex items-start gap-2.5 text-[13px] leading-snug text-muted-foreground">
            <Icon className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
            {text}
          </li>
        ))}
      </ul>

      <a
        href={BRAND.whatsapp}
        target="_blank"
        rel="noreferrer noopener"
        className="inline-flex items-center gap-2 text-sm font-bold text-primary transition-colors hover:text-primary-hover"
      >
        <MessageCircle className="size-4" aria-hidden />
        Ask us anything before you order
      </a>
    </div>
  );
}
