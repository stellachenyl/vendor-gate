"use client";

import Link from "next/link";
import { DataTable } from "@/components/data/DataTable";
import { PriorityBadge, RiskTierBadge } from "@/components/quality/PriorityBadge";
import { StatusBadge, AuditStatusBadge } from "@/components/quality/StatusBadge";
import {
  audits,
  dashboardStats,
  getSupplier,
  inspections,
  ncrs,
  suppliers,
} from "@/lib/mock-data";
import { useRole } from "@/lib/role-context";
import type { AuditEntry, RiskTier, Supplier } from "@/lib/types";
import { cn, formatDate } from "@/lib/utils";

const TIER_COLORS: Record<RiskTier, string> = {
  Low: "#10B981",
  Medium: "#F59E0B",
  High: "#F97316",
  Critical: "#DC2626",
};
const TIERS: RiskTier[] = ["Low", "Medium", "High", "Critical"];

function KpiCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string;
  hint: string;
  tone?: "default" | "warning" | "positive";
}) {
  return (
    <div className="card p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 font-mono text-3xl font-bold tracking-tight",
          tone === "warning" && "text-status-rejected",
          tone === "positive" && "text-status-approved",
          tone === "default" && "text-slate-900",
        )}
      >
        {value}
      </p>
      <p className="mt-0.5 text-xs text-slate-400">{hint}</p>
    </div>
  );
}

function RiskDonut({ visibleSuppliers }: { visibleSuppliers: ReadonlyArray<Supplier> }) {
  const counts = TIERS.map((tier) => ({
    tier,
    count: visibleSuppliers.filter((s) => s.riskTier === tier).length,
  })).filter((c) => c.count > 0);

  const total = counts.reduce((a, c) => a + c.count, 0);
  const R = 56;
  const CIRC = 2 * Math.PI * R;
  let offset = 0;

  return (
    <div className="card flex items-center gap-6 p-5">
      <svg
        viewBox="0 0 160 160"
        className="h-40 w-40 shrink-0 -rotate-90"
        role="img"
        aria-label={`Risk tier distribution of ${total} suppliers`}
      >
        <circle cx="80" cy="80" r={R} fill="none" stroke="#E2E8F0" strokeWidth="22" />
        {counts.map(({ tier, count }) => {
          const len = (count / total) * CIRC;
          const dash = `${len} ${CIRC - len}`;
          const el = (
            <circle
              key={tier}
              cx="80"
              cy="80"
              r={R}
              fill="none"
              stroke={TIER_COLORS[tier]}
              strokeWidth="22"
              strokeDasharray={dash}
              strokeDashoffset={-offset}
            />
          );
          offset += len;
          return el;
        })}
      </svg>
      <ul className="space-y-2">
        {TIERS.map((tier) => (
          <li key={tier} className="flex items-center gap-2 text-sm">
            <span
              aria-hidden
              className="h-3 w-3 rounded-sm"
              style={{ background: TIER_COLORS[tier] }}
            />
            <span className="w-16 font-medium text-slate-700">{tier}</span>
            <span className="font-mono text-slate-500">
              {visibleSuppliers.filter((s) => s.riskTier === tier).length}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function DashboardPage() {
  const { canView, role } = useRole();

  const visibleSuppliers = suppliers.filter((s) => canView(s.id));
  const visibleNcrs = ncrs.filter((n) => canView(n.supplierId));
  const activeNcrs = visibleNcrs.filter((n) => n.status !== "Closed");
  const recentNcrs = [...visibleNcrs]
    .sort((a, b) => b.raisedDate.localeCompare(a.raisedDate))
    .slice(0, 5);
  const upcomingAudits = audits
    .filter((a) => a.date >= new Date().toISOString().slice(0, 10) && a.status !== "Completed")
    .slice(0, 4);

  const worstColumns = [
    {
      key: "name" as const,
      header: "Supplier",
      render: (row: Supplier) => (
        <div>
          <Link href="/suppliers" className="font-medium text-accent hover:underline">
            {row.name}
          </Link>
          <p className="font-mono text-xs text-slate-400">{row.partCategory}</p>
        </div>
      ),
    },
    {
      key: "riskTier" as const,
      header: "Risk Tier",
      render: (row: Supplier) => <RiskTierBadge tier={row.riskTier} />,
    },
    {
      key: "ppmDefects" as const,
      header: "PPM Defects",
      align: "right" as const,
      render: (row: Supplier) => (
        <span className="font-mono">{row.ppmDefects.toLocaleString()}</span>
      ),
    },
    {
      key: "onTimeDeliveryPct" as const,
      header: "On-Time %",
      align: "right" as const,
      render: (row: Supplier) => (
        <span className="font-mono">{row.onTimeDeliveryPct}%</span>
      ),
    },
    {
      key: "overallScore" as const,
      header: "Score",
      align: "right" as const,
      value: (row: Supplier) => row.overallScore,
      render: (row: Supplier) => (
        <span className="font-mono font-bold text-slate-800">
          {row.overallScore.toFixed(1)}
        </span>
      ),
    },
  ];

  return (
    <>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="page-title">Quality Dashboard</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            {role} view · Week 34, FY2026 · All figures refresh nightly from the QMS.
          </p>
        </div>
      </div>

      {/* KPI row */}
      <section
        aria-label="Key performance indicators"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <KpiCard
          label="Total Suppliers"
          value={String(visibleSuppliers.length)}
          hint={`${suppliers.length} in approved vendor list`}
        />
        <KpiCard
          label="Active NCRs"
          value={String(activeNcrs.length)}
          hint="Open through verification stage"
          tone={activeNcrs.length > 3 ? "warning" : "default"}
        />
        <KpiCard
          label="Avg Inspection Pass Rate"
          value={`${dashboardStats.avgPassRate}%`}
          hint="Trailing 30 days, all part families"
          tone="positive"
        />
        <KpiCard
          label="Overdue Corrective Actions"
          value={String(dashboardStats.overdueCorrectiveActions)}
          hint="Past agreed response date"
          tone="warning"
        />
      </section>

      {/* Middle row */}
      <section className="mt-5 grid gap-5 lg:grid-cols-2">
        <div>
          <h2 className="mb-2 text-sm font-semibold text-slate-800">
            Supplier Risk Tier Distribution
          </h2>
          <RiskDonut visibleSuppliers={visibleSuppliers} />
        </div>
        <div>
          <h2 className="mb-2 text-sm font-semibold text-slate-800">
            Top 5 Worst-Performing Suppliers
          </h2>
          <DataTable
            columns={worstColumns}
            data={[...visibleSuppliers]
              .sort((a, b) => a.overallScore - b.overallScore)
              .slice(0, 5)}
            rowKey={(s) => s.id}
            pageSize={5}
            csvFilename="worst-performing-suppliers.csv"
          />
        </div>
      </section>

      {/* Bottom row */}
      <section className="mt-5 grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-800">
              Recent Nonconformances
            </h2>
            <Link
              href="/ncrs"
              className="text-sm font-medium text-accent hover:underline"
            >
              View all →
            </Link>
          </div>
          <ul role="list" className="space-y-2">
            {recentNcrs.map((ncr) => (
              <li
                key={ncr.id}
                className="card flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3"
              >
                <span className="font-mono text-sm font-bold text-slate-900">
                  {ncr.id}
                </span>
                <PriorityBadge priority={ncr.priority} />
                <StatusBadge status={ncr.status} />
                <span className="min-w-0 flex-1 truncate text-sm text-slate-600">
                  {ncr.title}
                </span>
                <span className="font-mono text-xs text-slate-400">
                  {formatDate(ncr.raisedDate)}
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
            <h2 className="text-sm font-semibold text-slate-800">Upcoming Audits</h2>
            <Link
              href="/audits"
              className="text-sm font-medium text-accent hover:underline"
            >
              Calendar →
            </Link>
          </div>
          <div className="card divide-y divide-line">
            {upcomingAudits.map((a: AuditEntry) => (
              <div key={a.id} className="px-4 py-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-slate-700">
                    {formatDate(a.date)}
                  </span>
                  <AuditStatusBadge status={a.status} />
                </div>
                <p className="mt-0.5 text-sm font-medium text-slate-700">{a.type}</p>
                <p className="text-xs text-slate-500">
                  {a.location} · {a.auditor}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
