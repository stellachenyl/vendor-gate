"use client";

import { useMemo, useState } from "react";
import { DataTable } from "@/components/data/DataTable";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/FormControls";
import { useToast } from "@/components/ui/Toast";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  audits,
  computeDashboardStats,
  inspections,
  ncrs,
  suppliers,
} from "@/lib/mock-data";
import { useRole } from "@/lib/role-context";
import { daysSince, formatCurrency, formatDate } from "@/lib/utils";

const REPORTS = [
  "Supplier Performance Summary",
  "Incoming Inspection Trend",
  "NCR Aging Analysis",
  "Audit Findings Distribution",
  "Cost of Poor Quality",
] as const;
type ReportName = (typeof REPORTS)[number];

export default function ReportsView() {
  const { canView, role } = useRole();
  const { showToast } = useToast();
  const [report, setReport] = useState<ReportName>("Supplier Performance Summary");
  const [supplierFilter, setSupplierFilter] = useState("All");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const visibleSuppliers = suppliers.filter((s) => canView(s.id));
  const visibleNcrs = ncrs.filter((n) => canView(n.supplierId));
  const visibleInspections = inspections.filter((i) => canView(i.supplierId));

  // Date-range + supplier filters applied to record-level reports.
  const inRange = (iso: string) =>
    (!dateFrom || iso >= dateFrom) && (!dateTo || iso <= dateTo);
  const scopedInspections = visibleInspections.filter(
    (i) =>
      inRange(i.receivedDate) &&
      (supplierFilter === "All" || i.supplierId === supplierFilter),
  );
  const scopedNcrs = visibleNcrs.filter(
    (n) =>
      inRange(n.raisedDate) &&
      (supplierFilter === "All" || n.supplierId === supplierFilter),
  );

  const copqBySupplier = useMemo(() => {
    return visibleSuppliers
      .map((s) => ({
        name: s.name,
        riskTier: s.riskTier,
        cost:
          scopedNcrs
            .filter((n) => n.supplierId === s.id)
            .reduce((acc, n) => acc + n.costImpactUsd, 0),
        openNcrs: scopedNcrs.filter(
          (n) => n.supplierId === s.id && n.status !== "Closed",
        ).length,
      }))
      .sort((a, b) => b.cost - a.cost);
  }, [visibleSuppliers, scopedNcrs]);

  const totalCopq = copqBySupplier.reduce((acc, r) => acc + r.cost, 0);
  const stats = computeDashboardStats(new Date().toISOString().slice(0, 10));

  const managementSummary =
    `Across ${visibleSuppliers.length} approved suppliers the portal is tracking ` +
    `${scopedActiveNcrCount(visibleNcrs)} active NCRs (${stats.majorNcrs} major, ${stats.minorNcrs} minor) ` +
    `with a rolling goods-in pass rate of ${stats.avgPassRate}% over the last 30 days. ` +
    `Cost of poor quality in scope totals ${formatCurrency(totalCopq)}, concentrated in ${
      copqBySupplier[0]?.name ?? "no single supplier"
    }. ` +
    `${stats.overdueCorrectiveActions} corrective action(s) are past due and ${stats.upcomingAudits} audit(s) are scheduled within the next two weeks — ` +
    `${stats.overdueCorrectiveActions > 0 ? "containment follow-up remains the top priority." : "the program is on track."}`;

  function scopedActiveNcrCount(list: typeof ncrs) {
    return list.filter((n) => n.status !== "Closed").length;
  }

  const agingBuckets = [
    { label: "0–7 days", min: 0, max: 7 },
    { label: "8–30 days", min: 8, max: 30 },
    { label: "31–60 days", min: 31, max: 60 },
    { label: "60+ days", min: 61, max: Infinity },
  ].map((bucket) => ({
    ...bucket,
    count: scopedNcrs.filter((n) => {
      if (n.status === "Closed") return false;
      const age = daysSince(n.raisedDate);
      return age >= bucket.min && age <= bucket.max;
    }).length,
  }));

  const findingsByType = ["System Audit", "Process Audit", "Product Audit"].map(
    (type) => ({
      type,
      findings: audits
        .filter((a) => a.type === type && (!a.supplierId || canView(a.supplierId)))
        .reduce((acc, a) => acc + (a.findingsCount ?? 0), 0),
    }),
  );

  return (
    <>
      <div className="mb-5">
        <h1 className="page-title">Quality Reports</h1>
        <p className="mt-0.5 text-sm text-slate-500">
          {role} view · Management review inputs per ISO 9001:2015 §9.3.
        </p>
      </div>

      {/* Report selector */}
      <section aria-label="Report selector" className="card mb-4 p-4">
        <fieldset>
          <legend className="mb-2 text-xs font-medium text-slate-600">Select report</legend>
          <div role="group" className="flex flex-wrap gap-2">
            {REPORTS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setReport(r)}
                aria-pressed={report === r}
                className={
                  report === r
                    ? "rounded-full border border-accent bg-accent px-3 py-1.5 text-xs font-semibold text-white"
                    : "rounded-full border border-line bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                }
              >
                {r}
              </button>
            ))}
          </div>
        </fieldset>

        <form
          aria-label="Report filters"
          onSubmit={(e) => e.preventDefault()}
          className="mt-4 grid gap-3 sm:grid-cols-4"
        >
          <Input label="Date from" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          <Input
            label="Date to"
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            error={dateFrom !== "" && dateTo !== "" && dateTo < dateFrom ? "'Date to' must be on or after 'Date from'" : undefined}
          />
          <Select
            label="Supplier"
            value={supplierFilter}
            onChange={(e) => setSupplierFilter(e.target.value)}
            options={[
              { value: "All", label: "All suppliers" },
              ...suppliers.map((s) => ({ value: s.id, label: `${s.name} (${s.code})` })),
            ]}
          />
          <div className="flex items-end gap-2">
            <Button size="sm" variant="secondary" onClick={() => showToast("PDF export queued (mock).", "success")}>
              Export PDF
            </Button>
            <Button size="sm" variant="secondary" onClick={() => showToast("CSV export queued (mock).", "info")}>
              Export CSV
            </Button>
          </div>
        </form>
      </section>

      {/* Management summary */}
      <section aria-label="Management summary" className="card mb-5 border-l-4 !border-l-accent p-5">
        <h2 className="mb-1 text-sm font-semibold text-slate-800">Management Summary</h2>
        <p className="text-sm leading-relaxed text-slate-700">{managementSummary}</p>
      </section>

      {/* Report preview */}
      <section aria-label={`Preview of ${report}`} className="space-y-5">
        {report === "Supplier Performance Summary" ? (
          <>
            <ChartPlaceholder caption="Weighted score by supplier (bar chart placeholder)" />
            <DataTable
              columns={[
                { key: "name", header: "Supplier" },
                { key: "riskTier", header: "Risk Tier" },
                {
                  key: "passRate",
                  header: "Pass Rate %",
                  align: "right",
                  render: (row: (typeof visibleSuppliers)[number]) => (
                    <span className="font-mono">{row.passRate.toFixed(1)}%</span>
                  ),
                  value: (row: (typeof visibleSuppliers)[number]) => row.passRate,
                },
                {
                  key: "overallScore",
                  header: "Weighted Score",
                  align: "right",
                  render: (row: (typeof visibleSuppliers)[number]) => (
                    <span className="font-mono font-bold">{row.overallScore.toFixed(1)}</span>
                  ),
                  value: (row: (typeof visibleSuppliers)[number]) => row.overallScore,
                },
              ]}
              data={[...visibleSuppliers].sort((a, b) => b.overallScore - a.overallScore)}
              rowKey={(s) => s.id}
              csvFilename="report-supplier-performance.csv"
              caption={`${report} — ${visibleSuppliers.length} suppliers`}
            />
          </>
        ) : null}

        {report === "Incoming Inspection Trend" ? (
          <>
            <ChartPlaceholder caption="Weekly pass/fail counts (line chart placeholder)" />
            <DataTable
              columns={[
                { key: "receivedDate", header: "Received" },
                { key: "lotNumber", header: "Lot" },
                { key: "partName", header: "Part" },
                { key: "sampleSize", header: "Sample", align: "right" },
                { key: "failCount", header: "Failures", align: "right" },
                { key: "disposition", header: "Disposition" },
              ]}
              data={[...scopedInspections]
                .sort((a, b) => b.receivedDate.localeCompare(a.receivedDate))
                .slice(0, 12)}
              rowKey={(i) => i.id}
              csvFilename="report-inspection-trend.csv"
              caption={`${report} — ${scopedInspections.length} lots in range`}
            />
          </>
        ) : null}

        {report === "NCR Aging Analysis" ? (
          <>
            <ChartPlaceholder caption="Aging buckets (stacked bar placeholder)" />
            <DataTable
              columns={[
                { key: "id", header: "NCR" },
                { key: "title", header: "Issue" },
                { key: "status", header: "Status" },
                {
                  key: "age",
                  header: "Days Open",
                  align: "right",
                  value: (row: (typeof scopedNcrs)[number]) => daysSince(row.raisedDate),
                  render: (row: (typeof scopedNcrs)[number]) => (
                    <span className="font-mono">{daysSince(row.raisedDate)}</span>
                  ),
                },
              ]}
              data={scopedNcrs}
              rowKey={(n) => n.id}
              csvFilename="report-ncr-aging.csv"
              caption="Open NCRs by age"
            />
            <ul role="list" className="grid gap-3 sm:grid-cols-4">
              {agingBuckets.map((b) => (
                <li key={b.label} className="card p-4 text-center">
                  <p className="text-xs uppercase tracking-wide text-slate-500">{b.label}</p>
                  <p className="mt-1 font-mono text-2xl font-bold text-slate-900">{b.count}</p>
                </li>
              ))}
            </ul>
          </>
        ) : null}

        {report === "Audit Findings Distribution" ? (
          <>
            <ChartPlaceholder caption="Findings by audit type (pie placeholder)" />
            <ul role="list" className="grid gap-3 sm:grid-cols-3">
              {findingsByType.map((f) => (
                <li key={f.type} className="card p-4 text-center">
                  <p className="text-xs uppercase tracking-wide text-slate-500">{f.type}</p>
                  <p className="mt-1 font-mono text-3xl font-bold text-slate-900">{f.findings}</p>
                </li>
              ))}
            </ul>
            {audits.every((a) => !canView(a.supplierId ?? "")) || audits.length === 0 ? (
              <EmptyState title="No audits planned. Schedule one to maintain compliance." />
            ) : null}
          </>
        ) : null}

        {report === "Cost of Poor Quality" ? (
          <>
            <ChartPlaceholder caption="COPQ by supplier (bar chart placeholder)" />
            <DataTable
              columns={[
                { key: "name", header: "Supplier" },
                { key: "riskTier", header: "Risk Tier" },
                {
                  key: "openNcrs",
                  header: "Open NCRs",
                  align: "right",
                },
                {
                  key: "cost",
                  header: "Cost Impact",
                  align: "right",
                  value: (row: (typeof copqBySupplier)[number]) => row.cost,
                  render: (row: (typeof copqBySupplier)[number]) => (
                    <span className="font-mono font-semibold">{formatCurrency(row.cost)}</span>
                  ),
                },
              ]}
              data={copqBySupplier}
              rowKey={(r) => r.name}
              pageSize={10}
              csvFilename="report-copq.csv"
              caption={`Total COPQ in scope: ${formatCurrency(totalCopq)}`}
            />
          </>
        ) : null}
      </section>

      <p className="mt-4 font-mono text-xs text-slate-400">
        Generated {formatDate(new Date().toISOString())} · Totalonics QMS · Uncontrolled when printed.
      </p>
    </>
  );
}

function ChartPlaceholder({ caption }: { caption: string }) {
  return (
    <figure className="card flex flex-col items-center gap-3 p-6">
      <div
        aria-hidden
        className="flex h-40 w-full max-w-xl items-end justify-center gap-2 rounded-md bg-gradient-to-t from-accent/20 via-accent/5 to-transparent p-4"
      >
        {[35, 60, 45, 80, 55, 70, 40, 65].map((h, i) => (
          <div key={i} className="w-6 rounded-t bg-accent/70" style={{ height: `${h}%` }} />
        ))}
      </div>
      <figcaption className="text-xs text-slate-500">{caption}</figcaption>
    </figure>
  );
}
