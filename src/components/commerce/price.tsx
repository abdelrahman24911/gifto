import { cn, formatEGP } from "@/lib/utils";

export function Price({
  value,
  compareAt,
  className,
  size = "md",
}: {
  value: number | string;
  compareAt?: number | string | null;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const hasDiscount =
    compareAt != null && Number(compareAt) > Number(value);

  return (
    <span className={cn("inline-flex flex-wrap items-baseline gap-x-2 gap-y-0.5", className)}>
      <span
        className={cn(
          "font-extrabold tabular-nums tracking-tight text-foreground",
          size === "sm" && "text-sm",
          size === "md" && "text-base",
          size === "lg" && "text-2xl",
        )}
      >
        {formatEGP(value)}
      </span>
      {hasDiscount ? (
        <>
          <span className="text-xs tabular-nums text-muted-foreground line-through decoration-destructive/60">
            {formatEGP(compareAt)}
          </span>
          <BadgeDiscount percent={Math.round((1 - Number(value) / Number(compareAt)) * 100)} />
        </>
      ) : null}
    </span>
  );
}

function BadgeDiscount({ percent }: { percent: number }) {
  if (percent <= 0) return null;
  return (
    <span className="rounded-pill bg-destructive-soft px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-destructive">
      -{percent}%
    </span>
  );
}
