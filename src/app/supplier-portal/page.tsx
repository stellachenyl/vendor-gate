"use client";

import dynamic from "next/dynamic";
import { ChartSkeleton, Skeleton, TableSkeleton } from "@/components/ui/Skeleton";

const SupplierPortalView = dynamic(() => import("./SupplierPortalView"), {
  ssr: false,
  loading: () => (
    <div aria-busy="true" aria-label="Loading supplier portal">
      <Skeleton className="h-8 w-72" />
      <div className="mt-5">
        <ChartSkeleton />
      </div>
      <div className="mt-5">
        <TableSkeleton rows={5} />
      </div>
    </div>
  ),
});

export default function SupplierPortalPage() {
  return <SupplierPortalView />;
}
