import type { RevenuePoint } from "@/lib/data/analytics";
import { formatDate, formatEGP } from "@/lib/utils";

export function RevenueChart({ series }: { series: RevenuePoint[] }) {
  const max = Math.max(1, ...series.map((point) => point.revenue));
  const total = series.reduce((sum, point) => sum + point.revenue, 0);

  if (series.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        No revenue recorded in the last 30 days.
      </p>
    );
  }

  return (
    <figure>
      <figcaption className="sr-only">
        Daily revenue for the last {series.length} days, totalling {formatEGP(total)}.
      </figcaption>
      <div className="flex h-40 items-end gap-1" role="img" aria-label={`Revenue over the last ${series.length} days. Total ${formatEGP(total)}.`}>
        {series.map((point) => {
          const height = Math.max(2, Math.round((point.revenue / max) * 100));
          return (
            <div key={point.date} className="group relative flex flex-1 flex-col justify-end">
              <div
                className="w-full rounded-t-[3px] bg-primary/70 transition-colors group-hover:bg-primary"
                style={{ height: `${height}%` }}
              />
              <div className="pointer-events-none absolute -top-1 left-1/2 z-10 hidden -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md border border-border bg-surface px-2 py-1 text-[11px] font-semibold shadow-pop group-hover:block">
                {formatDate(point.date)} · {formatEGP(point.revenue)} · {point.orders} order
                {point.orders === 1 ? "" : "s"}
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex justify-between text-[11px] font-medium text-muted-foreground">
        <span>{formatDate(series[0].date)}</span>
        <span>{formatDate(series[series.length - 1].date)}</span>
      </div>
    </figure>
  );
}
