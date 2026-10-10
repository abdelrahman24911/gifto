import Link from "next/link";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaginationProps {
  page: number;
  pageCount: number;
  /** Builds the href for a 1-based page number, keeping every other filter. */
  hrefFor: (page: number) => string;
  className?: string;
}

function pageWindow(page: number, pageCount: number): (number | "gap")[] {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, i) => i + 1);

  const pages = new Set<number>([1, pageCount, page, page - 1, page + 1]);
  if (page <= 3) [2, 3, 4].forEach((p) => pages.add(p));
  if (page >= pageCount - 2) [pageCount - 3, pageCount - 2, pageCount - 1].forEach((p) => pages.add(p));

  const sorted = [...pages].filter((p) => p >= 1 && p <= pageCount).sort((a, b) => a - b);
  const out: (number | "gap")[] = [];
  for (const p of sorted) {
    if (out.length > 0 && p - (out[out.length - 1] as number) > 1) out.push("gap");
    out.push(p);
  }
  return out;
}

export function Pagination({ page, pageCount, hrefFor, className }: PaginationProps) {
  if (pageCount <= 1) return null;

  const items = pageWindow(page, pageCount);

  return (
    <nav aria-label="Pagination" className={cn("flex flex-wrap items-center justify-center gap-1.5", className)}>
      <PageLink href={hrefFor(Math.max(1, page - 1))} disabled={page <= 1} label="Previous page">
        <ChevronLeft className="size-4" aria-hidden />
      </PageLink>

      {items.map((item, index) =>
        item === "gap" ? (
          <span key={`gap-${index}`} className="grid size-9 place-items-center text-muted-foreground" aria-hidden>
            <MoreHorizontal className="size-4" />
          </span>
        ) : (
          <PageLink
            key={item}
            href={hrefFor(item)}
            current={item === page}
            label={`Page ${item}`}
          >
            {item}
          </PageLink>
        ),
      )}

      <PageLink href={hrefFor(Math.min(pageCount, page + 1))} disabled={page >= pageCount} label="Next page">
        <ChevronRight className="size-4" aria-hidden />
      </PageLink>
    </nav>
  );
}

function PageLink({
  href,
  children,
  current,
  disabled,
  label,
}: {
  href: string;
  children: React.ReactNode;
  current?: boolean;
  disabled?: boolean;
  label: string;
}) {
  const className = cn(
    "grid size-9 place-items-center rounded-pill text-sm font-bold transition-colors",
    current
      ? "bg-primary text-primary-foreground shadow-hairline"
      : "border border-border bg-surface text-foreground hover:border-border-strong hover:bg-surface-muted",
    disabled && "pointer-events-none opacity-40",
  );

  if (disabled) {
    return (
      <span className={className} aria-disabled="true" aria-label={label}>
        {children}
      </span>
    );
  }

  return (
    <Link href={href} className={className} aria-label={label} aria-current={current ? "page" : undefined}>
      {children}
    </Link>
  );
}
