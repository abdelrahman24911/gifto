import { Skeleton } from "@/components/ui/skeleton";

export default function ProductLoading() {
  return (
    <div className="container-page py-8 sm:py-10" aria-busy="true">
      <Skeleton className="h-4 w-64" />
      <div className="mt-6 grid gap-10 lg:grid-cols-2 lg:gap-14">
        <div>
          <Skeleton className="aspect-square w-full rounded-card" />
          <div className="mt-3 grid grid-cols-5 gap-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="aspect-square w-full rounded-lg" />
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-9 w-3/4" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-20 w-full" />
          <div className="flex gap-3 pt-2">
            <Skeleton className="h-11 w-32 rounded-pill" />
            <Skeleton className="h-11 flex-1 rounded-pill" />
          </div>
          <div className="space-y-3 border-t border-border pt-6">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        </div>
      </div>
    </div>
  );
}
