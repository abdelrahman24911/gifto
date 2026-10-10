"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export function Quantity({
  value,
  onChange,
  min = 1,
  max = 99,
  disabled,
  className,
  size = "md",
}: {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  className?: string;
  size?: "sm" | "md";
}) {
  const clamp = (next: number) => Math.min(max, Math.max(min, next));

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-pill border border-border bg-surface",
        size === "sm" ? "h-9" : "h-11",
        disabled && "opacity-50",
        className,
      )}
      role="group"
      aria-label="Quantity"
    >
      <button
        type="button"
        aria-label="Decrease quantity"
        disabled={disabled || value <= min}
        onClick={() => onChange(clamp(value - 1))}
        className={cn(
          "grid place-items-center rounded-pill text-foreground transition-colors hover:bg-muted disabled:opacity-40",
          size === "sm" ? "size-9" : "size-11",
        )}
      >
        <Minus className={size === "sm" ? "size-3.5" : "size-4"} aria-hidden />
      </button>
      <output
        className={cn(
          "min-w-8 text-center font-bold tabular-nums",
          size === "sm" ? "text-sm" : "text-sm",
        )}
        aria-live="polite"
      >
        {value}
      </output>
      <button
        type="button"
        aria-label="Increase quantity"
        disabled={disabled || value >= max}
        onClick={() => onChange(clamp(value + 1))}
        className={cn(
          "grid place-items-center rounded-pill text-foreground transition-colors hover:bg-muted disabled:opacity-40",
          size === "sm" ? "size-9" : "size-11",
        )}
      >
        <Plus className={size === "sm" ? "size-3.5" : "size-4"} aria-hidden />
      </button>
    </div>
  );
}
