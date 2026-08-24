import { TableSkeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div aria-busy="true">
      <TableSkeleton rows={8} />
    </div>
  );
}
