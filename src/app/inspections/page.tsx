"use client";

import { useMemo, useState } from "react";
import { InspectionRecord } from "@/components/quality/InspectionRecord";
import { Select } from "@/components/ui/FormControls";
import { inspections } from "@/lib/mock-data";
import { useRole } from "@/lib/role-context";

const DISPOSITIONS = [
  "All",
  "Accepted",
  "Rejected",
  "Use As Is",
  "Rework",
  "Return to Supplier",
] as const;

export default function InspectionsPage() {
  const { canView, role } = useRole();
  const [disposition, setDisposition] = useState<(typeof DISPOSITIONS)[number]>("All");

  const visible = useMemo(
    () => inspections.filter((i) => canView(i.supplierId)),
    [canView],
  );

  const filtered = useMemo(
    () =>
      [...visible]
        .filter((i) => disposition === "All" || i.disposition === disposition)
        .sort((a, b) => b.receivedDate.localeCompare(a.receivedDate)),
    [visible, disposition],
  );

  return (
    <>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="page-title">Incoming Inspection Records</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            {role} view · Sampling per ANSI/ASQ Z1.4. Lots failing AQL are auto-routed to
            NCR.
          </p>
        </div>
        <div className="w-52">
          <Select
            aria-label="Filter by disposition"
            value={disposition}
            onChange={(e) =>
              setDisposition(e.target.value as (typeof DISPOSITIONS)[number])
            }
            options={DISPOSITIONS.map((d) => ({
              value: d,
              label: d === "All" ? "All dispositions" : d,
            }))}
          />
        </div>
      </div>

      <p className="mb-3 text-xs text-slate-500">
        Showing <span className="font-mono">{filtered.length}</span> of{" "}
        <span className="font-mono">{visible.length}</span> inspection records.
      </p>

      <div className="space-y-3">
        {filtered.map((record) => (
          <InspectionRecord key={record.id} record={record} />
        ))}
        {filtered.length === 0 ? (
          <p className="card px-4 py-10 text-center text-sm text-slate-400">
            No inspection records match the selected disposition.
          </p>
        ) : null}
      </div>
    </>
  );
}
