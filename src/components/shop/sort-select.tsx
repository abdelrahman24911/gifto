"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, SlidersHorizontal } from "lucide-react";
import { SORT_OPTIONS, activeFilterCount } from "@/lib/shop-params";
import type { ProductSort } from "@/lib/data/products";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";

export { activeFilterCount };

export function SortSelect({ value }: { value: ProductSort }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const onChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const next = new URLSearchParams(searchParams.toString());
    const sort = event.target.value as ProductSort;
    if (sort === "featured") next.delete("sort");
    else next.set("sort", sort);
    next.delete("page");
    const query = next.toString();
    router.replace(query ? `/shop?${query}` : "/shop");
  };

  return (
    <div className="relative">
      <label htmlFor="shop-sort" className="sr-only">
        Sort products
      </label>
      <select
        id="shop-sort"
        value={value}
        onChange={onChange}
        className="h-10 w-full appearance-none rounded-pill border border-border-strong bg-surface py-0 pl-4 pr-9 text-sm font-semibold text-foreground transition-colors focus:border-primary focus:outline-none"
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
    </div>
  );
}

export function FiltersButton({
  activeCount,
  panel,
}: {
  activeCount: number;
  panel: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} aria-haspopup="dialog">
        <SlidersHorizontal className="size-4" aria-hidden />
        Filters
        {activeCount > 0 ? (
          <span className="grid min-w-5 place-items-center rounded-pill bg-primary px-1.5 text-[11px] font-bold leading-5 text-white">
            {activeCount}
          </span>
        ) : null}
      </Button>

      <Dialog open={open} onClose={() => setOpen(false)} title="Filters" size="md">
        <div className="max-h-[70vh] overflow-y-auto pr-1">{panel}</div>
      </Dialog>
    </>
  );
}
