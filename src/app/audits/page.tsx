"use client";

import dynamic from "next/dynamic";
import { KpiSkeleton, Skeleton, TableSkeleton } from "@/components/ui/Skeleton";

// Lazy-loaded: the audits view pulls in the calendar + Gantt widgets.
const AuditsView = dynamic(() => import("./AuditsView"), {
  ssr: false,
  loading: () => (
    <div aria-busy="true" aria-label="Loading audit management">
      <Skeleton className="h-8 w-64" />
      <div className="mt-5">
        <KpiSkeleton count={3} />
      </div>
      <div className="mt-5">
        <TableSkeleton rows={8} />
      </div>
    </div>
  ),
});

export default function AuditsPage() {
  return <AuditsView />;
}
