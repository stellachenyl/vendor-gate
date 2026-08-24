"use client";

import dynamic from "next/dynamic";
import { ChartSkeleton, KpiSkeleton, TableSkeleton } from "@/components/ui/Skeleton";

const ReportsView = dynamic(() => import("./ReportsView"), {
  ssr: false,
  loading: () => (
    <div aria-busy="true" aria-label="Loading quality reports">
      <Skeleton h={8} w={56} />
      <div className="mt-5">
        <KpiSkeleton count={4} />
      </div>
      <div className="mt-5">
        <ChartSkeleton />
      </div>
      <div className="mt-5">
        <TableSkeleton rows={8} />
      </div>
    </div>
  ),
});

function Skeleton({ h, w }: { h: number; w: number }) {
  return <div aria-hidden className="animate-pulse rounded-md bg-slate-200/70" style={{ height: h * 4, width: `${w * 4}px` }} />;
}

export default function ReportsPage() {
  return <ReportsView />;
}
