"use client";

import dynamic from "next/dynamic";
import { Skeleton, TableSkeleton } from "@/components/ui/Skeleton";

const SettingsView = dynamic(() => import("./SettingsView"), {
  ssr: false,
  loading: () => (
    <div aria-busy="true" aria-label="Loading portal settings">
      <Skeleton className="h-8 w-56" />
      <div className="mt-5">
        <TableSkeleton rows={6} />
      </div>
    </div>
  ),
});

export default function SettingsPage() {
  return <SettingsView />;
}
