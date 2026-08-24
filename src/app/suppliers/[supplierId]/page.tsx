"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { DataTable } from "@/components/data/DataTable";
import { SupplierScorecard } from "@/components/quality/SupplierScorecard";
import { PriorityBadge, RiskTierBadge } from "@/components/quality/PriorityBadge";
import { ApprovalStatusBadge, StatusBadge } from "@/components/quality/StatusBadge";
import { DocumentVault } from "@/components/quality/DocumentVault";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import {
  audits,
  documents,
  getSupplier,
  inspections,
  ncrs,
} from "@/lib/mock-data";
import { useRole } from "@/lib/role-context";
import type { InspectionRecord } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export default function SupplierDetailPage() {
  const params = useParams<{ supplierId: string }>();
  const router = useRouter();
  const { showToast } = useToast();
  const { canView, role } = useRole();

  const supplier = getSupplier(params.supplierId);

  if (!supplier || !canView(supplier.id)) {
    return (
      <div className="card mx-auto max-w-lg p-10 text-center">
        <h1 className="text-base font-semibold text-slate-900">Supplier not found</h1>
        <p className="mt-1 text-sm text-slate-500">
          This supplier does not exist or you are not authorized to view it.
        </p>
        <Link href="/suppliers" className="mt-4 inline-block text-sm font-medium text-accent hover:underline">
          ← Back to supplier list
        </Link>
      </div>
    );
  }

  const supplierInspections = inspections
    .filter((i) => i.supplierId === supplier.id)
    .sort((a, b) => b.receivedDate.localeCompare(a.receivedDate))
    .slice(0, 20);
  const openNcrs = ncrs.filter((n) => n.supplierId === supplier.id && n.status !== "Closed");
  const supplierDocs = documents.filter((d) => d.supplierId === supplier.id);
  const supplierAudits = audits.filter((a) => a.supplierId === supplier.id);

  const inspectionColumns = [
    {
      key: "lotNumber" as const,
      header: "Lot Number",
      render: (row: InspectionRecord) => (
        <span className="font-mono font-semibold">{row.lotNumber}</span>
      ),
    },
    { key: "partName" as const, header: "Part" },
    {
      key: "receivedDate" as const,
      header: "Date",
      value: (row: InspectionRecord) => row.receivedDate,
      render: (row: InspectionRecord) => (
        <span className="font-mono text-xs">{row.receivedDate}</span>
      ),
    },
    { key: "sampleSize" as const, header: "Sample", align: "right" as const },
    {
      key: "passCount" as const,
      header: "Pass / Fail",
      align: "right" as const,
      render: (row: InspectionRecord) => (
        <span className="font-mono">
          {row.passCount} / <span className={row.failCount > 0 ? "text-red-600" : ""}>{row.failCount}</span>
        </span>
      ),
    },
    { key: "disposition" as const, header: "Disposition" },
  ];

  return (
    <>
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-3 text-xs text-slate-400">
        <Link href="/suppliers" className="hover:text-accent hover:underline">
          Suppliers
        </Link>{" "}
        / <span className="font-mono">{supplier.code}</span>
      </nav>

      {/* Header */}
      <header className="card mb-5 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-slate-900">{supplier.name}</h1>
              <RiskTierBadge tier={supplier.riskTier} />
              {supplier.status === "Active" ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                  <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-risk-low" />
                  Active
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500">
                  Inactive
                </span>
              )}
            </div>
            <p className="mt-1 font-mono text-xs text-slate-500">
              {supplier.id} · {supplier.code} · {supplier.category}
            </p>
            <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs text-slate-600 sm:grid-cols-2">
              <dt>Contact</dt>
              <dd>
                {supplier.contactName} ·{" "}
                <a href={`mailto:${supplier.contactEmail}`} className="text-accent hover:underline">
                  {supplier.contactEmail}
                </a>{" "}
                · {supplier.phone}
              </dd>
              <dt>Location</dt>
              <dd>{supplier.location}</dd>
              <dt>Last Audit</dt>
              <dd className="font-mono">{supplier.lastAuditDate ?? "Never audited"}</dd>
              <dt>Open NCRs</dt>
              <dd className="font-mono">{supplier.openNcrs}</dd>
            </dl>
          </div>
          <div className="flex flex-col gap-2">
            {role === "Quality Manager" ? (
              <Button
                onClick={() =>
                  showToast(`Audit request logged for ${supplier.name}.`, "success")
                }
              >
                Schedule Audit
              </Button>
            ) : null}
            <Button variant="secondary" onClick={() => router.push(`/ncrs?new=1&supplier=${supplier.id}`)}>
              Raise NCR
            </Button>
          </div>
        </div>
      </header>

      {/* Scorecard */}
      <section aria-label="Performance scorecard" className="mb-6 grid gap-5 lg:grid-cols-[320px_1fr]">
        <SupplierScorecard supplier={supplier} />
        <div className="card grid content-start gap-4 p-5 sm:grid-cols-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Goods-In Pass Rate</p>
            <p className="mt-1 font-mono text-xl font-bold text-slate-900">
              {supplier.passRate.toFixed(1)}%
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">On-Time Delivery</p>
            <p className="mt-1 font-mono text-xl font-bold text-slate-900">
              {supplier.onTimeDeliveryPct}%
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">PPM Defects</p>
            <p className="mt-1 font-mono text-xl font-bold text-slate-900">
              {supplier.ppmDefects.toLocaleString()}
            </p>
          </div>
          <p className="text-xs leading-relaxed text-slate-500 sm:col-span-3">
            Scores weight quality (35%), delivery (25%), responsiveness (15%), documentation (10%)
            and pricing (15%). Review cadence follows the risk tier; Critical-tier suppliers are
            re-audited every quarter.
          </p>
        </div>
      </section>

      {/* Inspection history */}
      <section aria-label="Inspection history" className="mb-6">
        <DataTable
          columns={inspectionColumns}
          data={supplierInspections}
          rowKey={(i) => i.id}
          pageSize={8}
          csvFilename={`inspections-${supplier.code.toLowerCase()}.csv`}
          caption={`Incoming Inspection History (${supplierInspections.length})`}
        />
      </section>

      {/* Open NCRs + Audit history */}
      <section className="mb-6 grid gap-5 lg:grid-cols-2">
        <div>
          <h2 className="mb-2 text-sm font-semibold text-slate-800">
            Open NCRs <span className="font-mono font-normal text-slate-400">({openNcrs.length})</span>
          </h2>
          <ul role="list" className="space-y-2">
            {openNcrs.map((ncr) => (
              <li key={ncr.id}>
                <Link
                  href={`/ncrs/${ncr.id}`}
                  className="card flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 hover:bg-accent-soft/40"
                >
                  <span className="font-mono text-sm font-bold text-accent">{ncr.id}</span>
                  <PriorityBadge priority={ncr.priority} />
                  <StatusBadge status={ncr.status} />
                  <span className="min-w-0 flex-1 truncate text-sm text-slate-600">{ncr.title}</span>
                </Link>
              </li>
            ))}
            {openNcrs.length === 0 ? (
              <li className="card px-4 py-6 text-center text-sm text-slate-400">
                No open NCRs — clean record.
              </li>
            ) : null}
          </ul>

          <h2 className="mb-2 mt-5 text-sm font-semibold text-slate-800">Audit History</h2>
          <ul role="list" className="space-y-2">
            {supplierAudits.map((a) => (
              <li key={a.id} className="card px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono text-xs font-bold text-slate-700">
                    {a.id} · {formatDate(a.date)}
                  </span>
                  <span
                    className={
                      a.closureStatus === "Closed"
                        ? "rounded-full border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700"
                        : "rounded-full border border-red-300 bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700"
                    }
                  >
                    Findings {a.closureStatus ?? "N/A"}
                  </span>
                </div>
                <p className="mt-0.5 text-sm font-medium text-slate-700">{a.type} · {a.auditor}</p>
                {a.findingsSummary ? (
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">{a.findingsSummary}</p>
                ) : null}
              </li>
            ))}
            {supplierAudits.length === 0 ? (
              <li className="card px-4 py-6 text-center text-sm text-slate-400">
                No audits on record yet.
              </li>
            ) : null}
          </ul>
        </div>

        <div>
          <DocumentVault documents={supplierDocs} />
        </div>
      </section>
    </>
  );
}
