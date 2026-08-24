"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DataTable } from "@/components/data/DataTable";
import { RiskTierBadge } from "@/components/quality/PriorityBadge";
import { NewSupplierModal } from "@/components/forms/NewSupplierModal";
import { Input, Select } from "@/components/ui/FormControls";
import { suppliers as allSuppliers } from "@/lib/mock-data";
import { useRole } from "@/lib/role-context";
import type { Supplier, SupplierCategory, SupplierStatus } from "@/lib/types";

const RISKS = ["All", "Low", "Medium", "High", "Critical"] as const;
const STATUSES = ["All", "Active", "Inactive"] as const;
const CATEGORIES: Array<SupplierCategory | "All"> = [
  "All",
  "Machining",
  "Plastics",
  "Electronics",
  "Packaging",
  "Raw Material",
];

function SuppliersPageContent() {
  const router = useRouter();
  const { canView, role } = useRole();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [riskFilter, setRiskFilter] = useState<(typeof RISKS)[number]>("All");
  const [categoryFilter, setCategoryFilter] =
    useState<SupplierCategory | "All">("All");
  const [statusFilter, setStatusFilter] = useState<(typeof STATUSES)[number]>("All");
  const [addOpen, setAddOpen] = useState(false);

  const visible = useMemo(() => allSuppliers.filter((s) => canView(s.id)), [canView]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return visible.filter((s) => {
      const matchesQuery =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.code.toLowerCase().includes(q);
      const matchesRisk = riskFilter === "All" || s.riskTier === riskFilter;
      const matchesCategory =
        categoryFilter === "All" || s.category === categoryFilter;
      const matchesStatus = statusFilter === "All" || s.status === statusFilter;
      return matchesQuery && matchesRisk && matchesCategory && matchesStatus;
    });
  }, [visible, query, riskFilter, categoryFilter, statusFilter]);

  const columns = [
    {
      key: "name" as const,
      header: "Supplier Name",
      value: (row: Supplier) => row.name,
      render: (row: Supplier) => (
        <p className="font-medium text-accent">{row.name}</p>
      ),
    },
    { key: "code" as const, header: "Code", render: (row: Supplier) => <span className="font-mono">{row.code}</span> },
    { key: "category" as const, header: "Category" },
    {
      key: "riskTier" as const,
      header: "Risk Tier",
      value: (row: Supplier) => row.riskTier,
      render: (row: Supplier) => <RiskTierBadge tier={row.riskTier} />,
    },
    {
      key: "passRate" as const,
      header: "Pass Rate %",
      align: "right" as const,
      value: (row: Supplier) => row.passRate,
      render: (row: Supplier) => (
        <span className="font-mono font-semibold text-slate-800">{row.passRate.toFixed(1)}%</span>
      ),
    },
    {
      key: "openNcrs" as const,
      header: "Open NCRs",
      align: "right" as const,
      value: (row: Supplier) => row.openNcrs,
      render: (row: Supplier) =>
        row.openNcrs > 0 ? (
          <span className="font-mono font-semibold text-red-600">{row.openNcrs}</span>
        ) : (
          <span className="font-mono text-slate-400">0</span>
        ),
    },
    {
      key: "lastAuditDate" as const,
      header: "Last Audit",
      value: (row: Supplier) => row.lastAuditDate ?? "",
      render: (row: Supplier) =>
        row.lastAuditDate ? (
          <span className="font-mono text-xs">{row.lastAuditDate}</span>
        ) : (
          <span className="text-xs text-slate-400">Never</span>
        ),
    },
    {
      key: "status" as const,
      header: "Status",
      value: (row: Supplier) => row.status,
      render: (row: Supplier) =>
        row.status === "Active" ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-risk-low" />
            Active
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-slate-400" />
            Inactive
          </span>
        ),
    },
  ];

  return (
    <>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="page-title">Approved Supplier List</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            {role} view · Click a supplier to open its detail record.
          </p>
        </div>
        {role === "Quality Manager" ? (
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="rounded-md border border-accent bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
          >
            + Add Supplier
          </button>
        ) : null}
      </div>

      {/* Filters */}
      <form
        role="search"
        aria-label="Supplier filters"
        onSubmit={(e) => e.preventDefault()}
        className="card mb-4 flex flex-wrap items-end gap-3 p-4"
      >
        <div className="w-64">
          <Input
            type="search"
            aria-label="Search by supplier name or code"
            placeholder="Name or code…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="w-44">
          <Select
            aria-label="Filter by category"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as SupplierCategory | "All")}
            options={CATEGORIES.map((c) => ({ value: c, label: c === "All" ? "All categories" : c }))}
          />
        </div>
        <div className="w-40">
          <Select
            aria-label="Filter by risk tier"
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value as (typeof RISKS)[number])}
            options={RISKS.map((r) => ({ value: r, label: r === "All" ? "All risk tiers" : r }))}
          />
        </div>
        <fieldset className="flex flex-col">
          <legend className="mb-1 text-xs font-medium text-slate-600">Status</legend>
          <div
            role="group"
            aria-label="Filter by status"
            className="flex overflow-hidden rounded-md border border-line"
          >
            {STATUSES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                aria-pressed={statusFilter === s}
                className={
                  statusFilter === s
                    ? "bg-accent px-3 py-1.5 text-xs font-semibold text-white"
                    : "bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                }
              >
                {s}
              </button>
            ))}
          </div>
        </fieldset>
      </form>

      <DataTable
        columns={columns}
        data={filtered}
        rowKey={(s) => s.id}
        csvFilename="approved-supplier-list.csv"
        caption={`${filtered.length} of ${visible.length} suppliers`}
        onRowClick={(s) => router.push(`/suppliers/${s.id}`)}
      />

      <NewSupplierModal open={addOpen} onClose={() => setAddOpen(false)} />
    </>
  );
}

export default function SuppliersPage() {
  // useSearchParams requires a Suspense boundary during static prerender.
  return (
    <Suspense fallback={null}>
      <SuppliersPageContent />
    </Suspense>
  );
}
