"use client";

import * as React from "react";
import { ProductImage } from "@/components/commerce/product-image";
import type { ProductImage as ProductImageRow } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ProductGallery({ images, name }: { images: ProductImageRow[]; name: string }) {
  const [active, setActive] = React.useState(0);
  const hasMany = images.length > 1;
  const current = images[active];

  return (
    <div>
      <div className="overflow-hidden rounded-card border border-border bg-surface shadow-card">
        <ProductImage
          path={current?.storage_path ?? null}
          alt={current?.alt_text ?? name}
          caption={name}
          sizes="(max-width: 1024px) 100vw, 45vw"
          priority
          className="aspect-square w-full"
        />
      </div>

      {hasMany ? (
        <ul className="mt-3 grid grid-cols-5 gap-3">
          {images.map((image, index) => (
            <li key={image.id}>
              <button
                type="button"
                onClick={() => setActive(index)}
                aria-label={`View image ${index + 1} of ${images.length}`}
                aria-current={index === active ? "true" : undefined}
                className={cn(
                  "block w-full overflow-hidden rounded-lg border-2 transition-colors",
                  index === active
                    ? "border-primary"
                    : "border-transparent hover:border-border-strong",
                )}
              >
                <ProductImage
                  path={image.storage_path}
                  alt={image.alt_text ?? `${name} thumbnail ${index + 1}`}
                  caption={name}
                  sizes="80px"
                  className="aspect-square w-full"
                />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
