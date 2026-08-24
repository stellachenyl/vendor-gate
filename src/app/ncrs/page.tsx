"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { NonConformanceReportCard } from "@/components/quality/NonConformanceReport";
import { NewNcrWizard } from "@/components/forms/NewNcrWizard";
import { Select, Input } from "@/components/ui/FormControls";
import { ncrs, suppliers } from "@/lib/mock-data";
import { useRole } from "@/lib/role-context";
import type { NcrStatus, Priority } from "@/lib/types";

const PRIORITIES: Array<Priority | "All"> = [
  "All",
  "Critical",
  "Major",
  "Minor",
  "Observation",
];
const STATUSES: Array<NcrStatus | "All"> = [
  "All",
  "Open",
  "Investigating",
  "Containment Done",
  "Root Cause Identified",
  "Verified",
  "Closed",
];

function NcrsPageContent() {
  const { canView, role } = useRole();
  const searchParams = useSearchParams();

  const [statusFilter, setStatusFilter] = useState<NcrStatus | "All">("All");
  const [severityFilter, setSeverityFilter] = useState<Priority | "All">("All");
  const [supplierFilter, setSupplierFilter] = useState("All");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [wizardOpen, setWizardOpen] = useState(searchParams.get("new") === "1");

  const visible = useMemo(() => ncrs.filter((n) => canView(n.supplierId)), [canView]);

  const filtered = useMemo(
    () =>
      [...visible]
        .filter((n) => {
          if (statusFilter !== "All" && n.status !== statusFilter) return false;
          if (severityFilter !== "All" && n.priority !== severityFilter) return false;
          if (supplierFilter !== "All" && n.supplierId !== supplierFilter) return false;
          if (dateFrom && n.raisedDate < dateFrom) return false;
          if (dateTo && n.raisedDate > dateTo) return false;
          return true;
        })
        .sort((a, b) => b.raisedDate.localeCompare(a.raisedDate)),
    [visible, statusFilter, severityFilter, supplierFilter, dateFrom, dateTo],
  );

  const wizardSupplier = searchParams.get("supplier") ?? "";
  const wizardPart = searchParams.get("part") ?? "";

  return (
    <>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="page-title">NCR Management — 8D Corrective Action</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            {role} view · Nonconformances follow the 8D methodology per IATF 16949 §10.2.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setWizardOpen(true)}
          className="rounded-md border border-accent bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
        >
          + New NCR
        </button>
      </div>

      {/* Filters */}
      <form
        aria-label="NCR filters"
        onSubmit={(e) => e.preventDefault()}
        className="card mb-5 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-6"
      >
        <Select
          aria-label="Filter by status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as NcrStatus | "All")}
          options={STATUSES.map((s) => ({ value: s, label: s === "All" ? "All statuses" : s }))}
        />
        <Select
          aria-label="Filter by severity"
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value as Priority | "All")}
          options={PRIORITIES.map((p) => ({
            value: p,
            label: p === "All" ? "All severities" : p,
          }))}
        />
        <Select
          aria-label="Filter by supplier"
          value={supplierFilter}
          onChange={(e) => setSupplierFilter(e.target.value)}
          options={[
            { value: "All", label: "All suppliers" },
            ...suppliers.map((s) => ({ value: s.id, label: `${s.name} (${s.code})` })),
          ]}
        />
        <Input
          label="Raised from"
          type="date"
          aria-label="Raised from date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
        />
        <Input
          label="Raised to"
          type="date"
          aria-label="Raised to date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
        />
        <p className="self-end text-xs text-slate-500">
          Showing <span className="font-mono font-semibold">{filtered.length}</span> of{" "}
          <span className="font-mono">{visible.length}</span> reports
        </p>
      </form>

      <div className="space-y-4">
        {filtered.map((ncr) => (
          <NonConformanceReportCard key={ncr.id} ncr={ncr} />
        ))}
        {filtered.length === 0 ? (
          <p
            role="status"
            className="card px-4 py-10 text-center text-sm text-slate-400"
          >
            No NCRs match the current filters.
          </p>
        ) : null}
      </div>

      <NewNcrWizard
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        initialSupplierId={wizardSupplier}
        initialPartNumber={wizardPart}
      />
    </>
  );
}

export default function NcrsPage() {
  // useSearchParams requires a Suspense boundary during static prerender.
  return (
    <Suspense fallback={null}>
      <NcrsPageContent />
    </Suspense>
  );
}
