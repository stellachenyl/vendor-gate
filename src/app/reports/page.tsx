"use client";

import { useMemo } from "react";
import { DataTable } from "@/components/data/DataTable";
import { RiskTierBadge } from "@/components/quality/PriorityBadge";
import { inspections, ncrs, suppliers, getSupplier } from "@/lib/mock-data";
import { useRole } from "@/lib/role-context";
import type { NonConformanceReport } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export default function ReportsPage() {
  const { canView, role } = useRole();

  const visibleSuppliers = useMemo(
    () => suppliers.filter((s) => canView(s.id)),
    [canView],
  );
  const visibleNcrs = useMemo(() => ncrs.filter((n) => canView(n.supplierId)), [canView]);
  const visibleInspections = useMemo(
    () => inspections.filter((i) => canView(i.supplierId)),
    [canView],
  );

  const supplierColumns = [
    {
      key: "name",
      header: "Supplier",
      value: (row: (typeof suppliers)[number]) => row.name,
      render: (row: (typeof suppliers)[number]) => (
        <div>
          <p className="font-medium">{row.name}</p>
          <p className="font-mono text-xs text-slate-400">{row.id}</p>
        </div>
      ),
    },
    {
      key: "riskTier",
      header: "Risk",
      value: (row: (typeof suppliers)[number]) => row.riskTier,
      render: (row: (typeof suppliers)[number]) => <RiskTierBadge tier={row.riskTier} />,
    },
    {
      key: "quality",
      header: "Quality KPI",
      align: "right" as const,
      render: (row: (typeof suppliers)[number]) => (
        <span className="font-mono">{row.kpis.quality}%</span>
      ),
    },
    {
      key: "delivery",
      header: "Delivery KPI",
      align: "right" as const,
      render: (row: (typeof suppliers)[number]) => (
        <span className="font-mono">{row.kpis.delivery}%</span>
      ),
    },
    {
      key: "overallScore",
      header: "Weighted Score",
      align: "right" as const,
      render: (row: (typeof suppliers)[number]) => (
        <span className="font-mono font-bold">{row.overallScore.toFixed(1)}</span>
      ),
    },
    {
      key: "ppmDefects",
      header: "PPM",
      align: "right" as const,
      render: (row: (typeof suppliers)[number]) => (
        <span className="font-mono">{row.ppmDefects.toLocaleString()}</span>
      ),
    },
  ];

  const ncrCostColumns = [
    {
      key: "id",
      header: "NCR",
      render: (row: NonConformanceReport) => (
        <span className="font-mono font-semibold">{row.id}</span>
      ),
    },
    {
      key: "supplierId",
      header: "Supplier",
      value: (row: NonConformanceReport) =>
        getSupplier(row.supplierId)?.name ?? row.supplierId,
      render: (row: NonConformanceReport) =>
        getSupplier(row.supplierId)?.name ?? row.supplierId,
    },
    { key: "title", header: "Issue" },
    {
      key: "quantityAffected",
      header: "Qty Affected",
      align: "right" as const,
      render: (row: NonConformanceReport) => (
        <span className="font-mono">{row.quantityAffected.toLocaleString()}</span>
      ),
    },
    {
      key: "costImpactUsd",
      header: "Cost Impact",
      align: "right" as const,
      value: (row: NonConformanceReport) => row.costImpactUsd,
      render: (row: NonConformanceReport) => (
        <span className="font-mono font-semibold">
          ${row.costImpactUsd.toLocaleString()}
        </span>
      ),
    },
    {
      key: "status",
      header: "8D Stage Complete",
      align: "right" as const,
      value: (row: NonConformanceReport) =>
        row.eightDProgress.filter((s) => s.done).length,
      render: (row: NonConformanceReport) => (
        <span className="font-mono">
          {row.eightDProgress.filter((s) => s.done).length}/8
        </span>
      ),
    },
  ];

  const totalCostImpact = visibleNcrs.reduce((a, n) => a + n.costImpactUsd, 0);
  const lotsAccepted = visibleInspections.filter(
    (i) => i.disposition === "Accepted",
  ).length;

  return (
    <>
      <div className="mb-5">
        <h1 className="page-title">Quality Performance Reports</h1>
        <p className="mt-0.5 text-sm text-slate-500">
          {role} view · Management review inputs per ISO 9001:2015 §9.3. Export any table
          to CSV for distribution to the quality council.
        </p>
      </div>

      <section aria-label="Report highlights" className="mb-5 grid gap-4 sm:grid-cols-3">
        <div className="card p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            YTD NCR Cost of Poor Quality
          </p>
          <p className="mt-1 font-mono text-2xl font-bold text-status-rejected">
            ${totalCostImpact.toLocaleString()}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Lots Accepted First Pass
          </p>
          <p className="mt-1 font-mono text-2xl font-bold text-slate-900">
            {lotsAccepted}/{visibleInspections.length}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Critical-Risk Suppliers
          </p>
          <p className="mt-1 font-mono text-2xl font-bold text-slate-900">
            {visibleSuppliers.filter((s) => s.riskTier === "Critical").length}
          </p>
        </div>
      </section>

      <section className="space-y-6">
        <DataTable
          columns={supplierColumns}
          data={[...visibleSuppliers].sort((a, b) => b.overallScore - a.overallScore)}
          rowKey={(s) => s.id}
          csvFilename={`supplier-performance-${new Date().toISOString().slice(0, 10)}.csv`}
          caption="Supplier Performance Summary — FY2026 YTD"
        />
        <DataTable
          columns={ncrCostColumns}
          data={visibleNcrs}
          rowKey={(n) => n.id}
          pageSize={6}
          csvFilename="ncr-cost-impact.csv"
          caption="Corrective Action Cost Impact Register"
        />
      </section>

      <p className="mt-4 font-mono text-xs text-slate-400">
        Report generated {formatDate(new Date().toISOString())} · Totalonics QMS ·
        Uncontrolled when printed.
      </p>
    </>
  );
}
