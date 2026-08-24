import { KpiSkeleton, Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div aria-busy="true">
      <Skeleton className="h-8 w-64" />
      <div className="mt-5"><KpiSkeleton count={5} /></div>
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Skeleton className="h-56" />
        <Skeleton className="h-56" />
      </div>
    </div>
  );
}
