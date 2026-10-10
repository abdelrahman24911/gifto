import { Skeleton } from "@/components/ui/skeleton";

export default function ShopLoading() {
  return (
    <div className="container-page py-10 sm:py-12" aria-busy="true">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="mt-5 h-9 w-64" />
      <Skeleton className="mt-3 h-4 w-44" />

      <div className="mt-8 grid gap-8 lg:grid-cols-[240px_1fr] lg:gap-10">
        <aside className="hidden lg:block">
          <div className="space-y-4 rounded-card border border-border bg-surface p-5">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="space-y-2.5">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ))}
          </div>
        </aside>

        <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-5 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index}>
              <Skeleton className="aspect-square w-full rounded-card" />
              <Skeleton className="mt-3.5 h-3 w-20" />
              <Skeleton className="mt-2 h-4 w-full" />
              <Skeleton className="mt-2 h-4 w-2/3" />
              <Skeleton className="mt-3 h-4 w-24" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
