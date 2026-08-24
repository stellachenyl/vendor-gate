"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { DataTable } from "@/components/data/DataTable";
import { RiskDonut } from "@/components/charts/RiskDonut";
import { MetricCard } from "@/components/ui/MetricCard";
import { PriorityBadge } from "@/components/quality/PriorityBadge";
import { AuditStatusBadge, StatusBadge } from "@/components/quality/StatusBadge";
import {
  audits,
  computeDashboardStats,
  getSupplier,
  ncrs,
  suppliers,
} from "@/lib/mock-data";
import { useRole } from "@/lib/role-context";
import type { RiskTier, Supplier } from "@/lib/types";
import { daysSince, formatDate } from "@/lib/utils";

const TIER_DOT: Record<RiskTier, string> = {
  Low: "bg-risk-low",
  Medium: "bg-risk-medium",
  High: "bg-risk-high",
  Critical: "bg-risk-critical",
};

const TREND_LABEL: Record<Supplier["trend"], string> = {
  improving: "\u25B2 improving",
  stable: "\u25AC stable",
  declining: "\u25BC declining",
};

function trendCell(supplier: Supplier) {
  const tone =
    supplier.trend === "improving"
      ? "text-status-approved"
      : supplier.trend === "declining"
        ? "text-status-rejected"
        : "text-slate-400";
  return <span className={`font-mono text-xs font-semibold ${tone}`}>{TREND_LABEL[supplier.trend]}</span>;
}

export default function DashboardPage() {
  const router = useRouter();
  const { canView, role } = useRole();
  const todayIso = new Date().toISOString().slice(0, 10);
  const stats = computeDashboardStats(todayIso);

  const visibleSuppliers = suppliers.filter((s) => canView(s.id));
  const visibleNcrs = ncrs.filter((n) => canView(n.supplierId));
  // Severity breakdown derives from the same scoped set as the card value so
  // the hint can never contradict the headline figure.
  const scopedActiveNcrs = visibleNcrs.filter((n) => n.status !== "Closed");
  const scopedMajor = scopedActiveNcrs.filter((n) => n.priority === "Major").length;
  const scopedMinor = scopedActiveNcrs.filter((n) => n.priority === "Minor").length;
  const scopedActiveSuppliers = visibleSuppliers.filter((s) => s.status === "Active").length;
  const scopedInactiveSuppliers =
    visibleSuppliers.length - scopedActiveSuppliers;
  const recentNcrs = [...visibleNcrs]
    .sort((a, b) => b.raisedDate.localeCompare(a.raisedDate))
    .slice(0, 5);
  const upcomingAudits = [...audits]
    .filter(
      (a) =>
        (a.status === "Scheduled" || a.status === "In Progress" || a.status === "Overdue") &&
        (!a.supplierId || canView(a.supplierId)),
    )
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5);

  const worstColumns = [
    {
      key: "name" as const,
      header: "Supplier Name",
      value: (row: Supplier) => row.name,
      render: (row: Supplier) => (
        <div>
          <p className="font-medium text-accent">{row.name}</p>
          <p className="font-mono text-xs text-slate-400">
            {row.code} · {row.category}
          </p>
        </div>
      ),
    },
    {
      key: "riskTier" as const,
      header: "Risk Tier",
      value: (row: Supplier) => row.riskTier,
      render: (row: Supplier) => (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700">
          <span aria-hidden className={`h-2 w-2 rounded-full ${TIER_DOT[row.riskTier]}`} />
          {row.riskTier}
        </span>
      ),
    },
    {
      key: "passRate" as const,
      header: "Pass Rate %",
      align: "right" as const,
      value: (row: Supplier) => row.passRate,
      render: (row: Supplier) => (
        <span className="font-mono font-bold text-slate-800">{row.passRate.toFixed(1)}%</span>
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
          <span className="font-mono text-xs">{formatDate(row.lastAuditDate)}</span>
        ) : (
          <span className="text-xs text-slate-400">Never</span>
        ),
    },
    {
      key: "trend" as const,
      header: "Trend",
      value: (row: Supplier) => row.trend,
      render: (row: Supplier) => trendCell(row),
    },
  ];

  return (
    <>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="page-title">Quality Dashboard</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            {role} view · KPIs refresh nightly from the QMS · Report date {formatDate(todayIso)}
          </p>
        </div>
      </div>

      {/* KPI row */}
      <section
        aria-label="Key performance indicators"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5"
      >
        <MetricCard
          label="Total Suppliers"
          value={String(visibleSuppliers.length)}
          hint={`${scopedActiveSuppliers} active · ${scopedInactiveSuppliers} inactive`}
        />
        <MetricCard
          label="Avg Inspection Pass Rate"
          value={`${stats.avgPassRate}%`}
          hint="All suppliers, last 30 days"
          tone={stats.avgPassRate >= 90 ? "positive" : "warning"}
        />
        <MetricCard
          label="Active NCRs"
          value={String(scopedActiveNcrs.length)}
          hint={`${scopedMajor} Major · ${scopedMinor} Minor`}
          tone={scopedActiveNcrs.length > 3 ? "warning" : "default"}
        />
        <MetricCard
          label="Overdue Corrective Actions"
          value={String(stats.overdueCorrectiveActions)}
          hint="Past agreed due date"
          tone={stats.overdueCorrectiveActions > 0 ? "warning" : "positive"}
        />
        <MetricCard
          label="Upcoming Audits"
          value={String(stats.upcomingAudits)}
          hint="Scheduled within 14 days"
        />
      </section>

      {/* Middle row */}
      <section className="mt-5 grid gap-5 lg:grid-cols-2">
        <div>
          <h2 className="mb-2 text-sm font-semibold text-slate-800">Supplier Risk Tier Distribution</h2>
          <RiskDonut suppliers={visibleSuppliers} />
        </div>
        <div>
          <h2 className="mb-2 text-sm font-semibold text-slate-800">
            Top 5 Worst Performers{" "}
            <span className="font-normal text-slate-400">(by pass rate)</span>
          </h2>
          <DataTable
            columns={worstColumns}
            data={[...visibleSuppliers].sort((a, b) => a.passRate - b.passRate).slice(0, 5)}
            rowKey={(s) => s.id}
            pageSize={5}
            csvFilename="worst-performing-suppliers.csv"
            onRowClick={(s) => router.push(`/suppliers/${s.id}`)}
          />
          <p className="mt-1 text-xs text-slate-400">Click a row to open the supplier detail.</p>
        </div>
      </section>

      {/* Bottom row */}
      <section className="mt-5 grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-800">Recent NCRs</h2>
            <Link href="/ncrs" className="text-sm font-medium text-accent hover:underline">
              View All →
            </Link>
          </div>
          <ul role="list" className="space-y-2">
            {recentNcrs.map((ncr) => (
              <li
                key={ncr.id}
                className="card flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3"
              >
                <Link href={`/ncrs/${ncr.id}`} className="font-mono text-sm font-bold text-accent hover:underline">
                  {ncr.id}
                </Link>
                <PriorityBadge priority={ncr.priority} />
                <StatusBadge status={ncr.status} />
                <span className="min-w-0 flex-1 truncate text-sm text-slate-600">
                  {getSupplier(ncr.supplierId)?.name ?? ncr.supplierId} · P/N {ncr.partNumber}
                </span>
                <span className="font-mono text-xs text-slate-400">
                  {daysSince(ncr.raisedDate)}d open
                </span>
              </li>
            ))}
            {recentNcrs.length === 0 ? (
              <li className="card px-4 py-8 text-center text-sm text-slate-400">
                No NCR records to display.
              </li>
            ) : null}
          </ul>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-800">
              Upcoming Audits{" "}
              <span className="font-normal text-slate-400">
                (next 5 · KPI counts 14 days)
              </span>
            </h2>
            <Link href="/audits" className="text-sm font-medium text-accent hover:underline">
              Calendar →
            </Link>
          </div>
          <div className="card divide-y divide-line">
            {upcomingAudits.map((a) => (
              <div key={a.id} className="px-4 py-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-slate-700">
                    {formatDate(a.date)}
                  </span>
                  <AuditStatusBadge status={a.status} />
                </div>
                <p className="mt-0.5 text-sm font-medium text-slate-700">{a.type}</p>
                <p className="text-xs text-slate-500">
                  {a.location} · Lead auditor: {a.auditor}
                </p>
              </div>
            ))}
            {upcomingAudits.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-slate-400">
                No audits scheduled.
              </p>
            ) : null}
          </div>
        </div>
      </section>
    </>
  );
}
