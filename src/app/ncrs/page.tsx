"use client";

import { useMemo, useState } from "react";
import { NonConformanceReportCard } from "@/components/quality/NonConformanceReport";
import { PriorityBadge } from "@/components/quality/PriorityBadge";
import { StatusBadge } from "@/components/quality/StatusBadge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input, Select, Textarea } from "@/components/ui/FormControls";
import { useToast } from "@/components/ui/Toast";
import { ncrs, getSupplier } from "@/lib/mock-data";
import { useRole } from "@/lib/role-context";
import type { NcrStatus, Priority } from "@/lib/types";

const PRIORITIES: Priority[] = ["Critical", "Major", "Minor", "Observation"];
const STATUSES: Array<NcrStatus | "All"> = [
  "All",
  "Open",
  "Investigating",
  "Containment Done",
  "Root Cause Identified",
  "Verified",
  "Closed",
];

function NewNcrModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { showToast } = useToast();
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Raise Nonconformance Report"
      description="D2 problem description is required at minimum. The supplier QSR is notified automatically."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              onClose();
              showToast(
                "NCR draft saved and routed to Supplier Quality Engineering.",
                "success",
              );
            }}
          >
            Submit NCR
          </Button>
        </>
      }
    >
      <form className="space-y-3" onSubmit={(e) => e.preventDefault()}>
        <Input label="Part Number" placeholder="e.g. TNX-3320-D" />
        <Select
          label="Supplier"
          options={[
            { value: "", label: "Select supplier…" },
            ...Array.from(new Set(ncrs.map((n) => n.supplierId))).map((id) => ({
              value: id,
              label: `${getSupplier(id)?.name ?? id} (${id})`,
            })),
          ]}
        />
        <Select
          label="Priority"
          options={PRIORITIES.map((p) => ({ value: p, label: p }))}
          defaultValue="Major"
        />
        <Textarea
          label="Defect Description (D2)"
          placeholder="Describe the nonconformance: characteristic affected, measured vs. specified, detection point…"
        />
        <Textarea
          label="Interim Containment (D3, if known)"
          placeholder="Quarantine location, stock verification, line-side actions…"
        />
      </form>
    </Modal>
  );
}

export default function NcrsPage() {
  const { canView, role } = useRole();
  const [statusFilter, setStatusFilter] = useState<(typeof STATUSES)[number]>("All");
  const [modalOpen, setModalOpen] = useState(false);

  const visible = useMemo(() => ncrs.filter((n) => canView(n.supplierId)), [canView]);

  const filtered = useMemo(
    () =>
      [...visible]
        .filter((n) => statusFilter === "All" || n.status === statusFilter)
        .sort((a, b) => b.raisedDate.localeCompare(a.raisedDate)),
    [visible, statusFilter],
  );

  const byStatus = (s: NcrStatus) =>
    [...visible]
      .filter((n) => n.status === s)
      .map((n) => ({ id: n.id, priority: n.priority, title: n.title }));

  return (
    <>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="page-title">Nonconformance Reports — 8D Tracker</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            {role} view · Corrective actions follow the 8D methodology per IATF 16949
            §10.2.
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)}>+ New NCR</Button>
      </div>

      {/* Status board summary */}
      <section
        aria-label="NCR pipeline"
        className="card mb-5 grid grid-cols-2 gap-px overflow-hidden bg-line sm:grid-cols-6"
      >
        {STATUSES.slice(1).map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => setStatusFilter(statusFilter === status ? "All" : status)}
            aria-pressed={statusFilter === status}
            className={`flex flex-col gap-1.5 bg-card px-3 py-3 text-left transition-colors hover:bg-accent-soft/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent ${
              statusFilter === status ? "bg-accent-soft" : ""
            }`}
          >
            <StatusBadge status={status as NcrStatus} />
            <span className="font-mono text-xl font-bold text-slate-800">
              {byStatus(status as NcrStatus).length}
            </span>
          </button>
        ))}
      </section>

      <p className="mb-3 text-xs text-slate-500">
        Showing <span className="font-mono">{filtered.length}</span> of{" "}
        <span className="font-mono">{visible.length}</span> reports.
        {statusFilter !== "All" ? " Filtered by status." : ""}
      </p>

      <div className="space-y-4">
        {filtered.map((ncr) => (
          <NonConformanceReportCard key={ncr.id} ncr={ncr} />
        ))}
        {filtered.length === 0 ? (
          <p className="card px-4 py-10 text-center text-sm text-slate-400">
            No NCRs match the selected filter. Clear the status board selection to see all
            records.
          </p>
        ) : null}
      </div>

      {/* Recent activity strip for context */}
      <section aria-label="Priority summary" className="mt-6 flex flex-wrap gap-2">
        {PRIORITIES.map((p) => (
          <span key={p} className="card inline-flex items-center gap-2 px-3 py-2 text-xs">
            <PriorityBadge priority={p} />
            <span className="font-mono font-semibold text-slate-700">
              {visible.filter((n) => n.priority === p).length}
            </span>
          </span>
        ))}
      </section>

      <NewNcrModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
