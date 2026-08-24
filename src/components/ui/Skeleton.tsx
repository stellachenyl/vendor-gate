import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("animate-pulse rounded-md bg-slate-200/70", className)}
    />
  );
}

/** Dashboard KPI row placeholder. */
export function KpiSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="card space-y-2 p-4">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-3 w-32" />
        </div>
      ))}
    </div>
  );
}

/** Generic table placeholder. */
export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="card p-4">
      <Skeleton className="mb-4 h-4 w-40" />
      <div className="space-y-3">
        {Array.from({ length: rows }, (_, i) => (
          <Skeleton key={i} className="h-6 w-full" />
        ))}
      </div>
    </div>
  );
}

/** Scorecard/chart placeholder. */
export function ChartSkeleton() {
  return (
    <div className="card flex items-center justify-center p-8">
      <Skeleton className="h-48 w-48 rounded-full" />
    </div>
  );
}
