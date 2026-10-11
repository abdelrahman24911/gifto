"use client";

import * as React from "react";
import Image from "next/image";
import { Gift } from "lucide-react";
import { cn, truncate } from "@/lib/utils";
import { BUCKETS, placeholderHue, storageUrl, type BucketName } from "@/lib/storage";

interface ProductImageProps {
  /** Supabase Storage path. `null` renders the designed placeholder. */
  path?: string | null;
  alt: string;
  bucket?: BucketName;
  className?: string;
  sizes?: string;
  priority?: boolean;
  /** Small label under the glyph on the placeholder. */
  caption?: string;
}

/**
 * Product imagery. The seed ships without photos on purpose, so every grid
 * falls back to a deterministic, on-brand placeholder instead of a broken box.
 */
export function ProductImage({
  path,
  alt,
  bucket = BUCKETS.products,
  className,
  sizes = "(max-width: 768px) 50vw, 33vw",
  priority,
  caption,
}: ProductImageProps) {
  const [failed, setFailed] = React.useState(false);
  const src = failed ? null : storageUrl(bucket, path);

  if (!src) {
    return <ImagePlaceholder label={caption ?? alt} className={className} />;
  }

  return (
    <div className={cn("relative overflow-hidden bg-surface-muted", className)}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        className="object-cover"
        onError={() => setFailed(true)}
      />
    </div>
  );
}

function ImagePlaceholder({ label, className }: { label: string; className?: string }) {
  const hue = placeholderHue(label);
  const initial = (label.trim()[0] ?? "G").toUpperCase();

  return (
    <div
      role="img"
      aria-label={label}
      className={cn(
        "relative flex select-none items-center justify-center overflow-hidden",
        "bg-[radial-gradient(120%_120%_at_20%_15%,var(--color-surface)_0%,var(--color-surface-muted)_55%,var(--color-muted)_100%)]",
        className,
      )}
      style={{
        backgroundImage: `radial-gradient(120% 120% at 20% 15%, hsl(${hue} 72% 96%) 0%, var(--color-surface-muted) 55%, var(--color-muted) 100%)`,
      }}
    >
      <div
        aria-hidden
        className="absolute -right-8 -top-10 size-36 rounded-full opacity-60 blur-2xl"
        style={{ background: `hsl(${hue} 55% 82%)` }}
      />
      <div
        aria-hidden
        className="absolute -bottom-12 -left-8 size-32 rounded-full opacity-50 blur-2xl"
        style={{ background: `hsl(${(hue + 40) % 360} 70% 86%)` }}
      />

      <div className="relative flex flex-col items-center gap-2 px-5 text-center">
        <span className="flex size-12 items-center justify-center rounded-pill border border-border/80 bg-surface/80 text-primary shadow-hairline">
          <Gift className="size-6" strokeWidth={1.6} aria-hidden />
        </span>
        <span className="text-lg font-extrabold tracking-tight text-foreground/80" aria-hidden>
          {initial}
        </span>
        <span className="max-w-[14ch] text-[11px] font-semibold leading-tight text-muted-foreground">
          {truncate(label, 34)}
        </span>
      </div>
    </div>
  );
}
