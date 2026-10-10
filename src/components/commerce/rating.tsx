import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function Rating({
  value,
  count,
  className,
  showValue = true,
}: {
  value: number | string;
  count?: number;
  className?: string;
  showValue?: boolean;
}) {
  const rating = Number(value) || 0;
  const rounded = Math.round(rating * 2) / 2;

  return (
    <span
      className={cn("inline-flex items-center gap-1.5", className)}
      aria-label={`Rated ${rating} out of 5${count != null ? ` from ${count} reviews` : ""}`}
    >
      <span className="flex items-center gap-0.5" aria-hidden>
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={cn(
              "size-3.5",
              rounded >= star
                ? "fill-accent text-accent"
                : rounded >= star - 0.5
                  ? "fill-accent/50 text-accent"
                  : "fill-border text-border",
            )}
          />
        ))}
      </span>
      {showValue ? (
        <span className="text-xs font-semibold tabular-nums text-muted-foreground">
          {rating.toFixed(1)}
        </span>
      ) : null}
      {count != null ? (
        <span className="text-xs text-muted-foreground">({count})</span>
      ) : null}
    </span>
  );
}
