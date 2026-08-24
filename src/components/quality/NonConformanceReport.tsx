import type { NonConformanceReport } from "@/lib/types";
import { getSupplier } from "@/lib/mock-data";
import { cn, daysSince, formatCurrency, formatDate } from "@/lib/utils";
import { PriorityBadge, RiskTierBadge } from "./PriorityBadge";
import { StatusBadge } from "./StatusBadge";
import { EightDStepper } from "./EightDStepper";

export function NonConformanceReportCard({
  ncr,
  today = new Date(),
}: {
  ncr: NonConformanceReport;
  today?: Date;
}) {
  const supplier = getSupplier(ncr.supplierId);
  const daysOpen = daysSince(ncr.raisedDate, today);

  return (
    <article
      className="rounded-lg border border-line bg-card p-5 shadow-card"
      aria-label={`Non-conformance report ${ncr.id}`}
    >
      <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-mono text-sm font-bold text-slate-900">{ncr.id}</h3>
            <PriorityBadge priority={ncr.priority} />
            <StatusBadge status={ncr.status} />
            {daysOpen > 0 ? (
              <span
                className={cn(
                  "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold",
                  daysOpen > 30 && ncr.status !== "Closed"
                    ? "border-red-300 bg-red-50 text-red-700"
                    : "border-slate-300 bg-slate-100 text-slate-600",
                )}
              >
                {daysOpen}d open
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-sm font-semibold text-slate-800">{ncr.title}</p>
          <p className="font-mono text-xs text-slate-500">
            P/N {ncr.partNumber} ·{" "}
            <RiskTierBadge tier={supplier?.riskTier ?? "Medium"} />{" "}
            <span className="ml-1 align-middle">{supplier?.name ?? ncr.supplierId}</span>
          </p>
        </div>
        <div className="text-right text-xs text-slate-500">
          Raised {formatDate(ncr.raisedDate)}
          <br />
          <span className="font-mono">Qty affected: {ncr.quantityAffected.toLocaleString()}</span>
          <br />
          <span className="font-mono">Cost impact: {formatCurrency(ncr.costImpactUsd)}</span>
        </div>
      </header>

      <EightDStepper progress={ncr.eightDProgress} />

      <dl className="mt-4 space-y-3 border-t border-line pt-3 text-sm">
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Defect Description
          </dt>
          <dd className="mt-0.5 line-clamp-2 leading-relaxed text-slate-700">
            {ncr.defectDescription}
          </dd>
        </div>
        <div className="flex flex-wrap gap-x-8 gap-y-2">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Assigned Engineer
            </dt>
            <dd className="mt-0.5 font-medium text-slate-700">{ncr.assignedEngineer}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Root Cause Category
            </dt>
            <dd className="mt-0.5 text-slate-700">{ncr.rootCauseCategory || "Under investigation"}</dd>
          </div>
        </div>
      </dl>

      <footer className="mt-3 flex flex-wrap justify-between gap-2 border-t border-line pt-3 font-mono text-xs text-slate-400">
        <span>Raised by {ncr.raisedBy}</span>
        <span>Team: {ncr.eightDTeam.length} member(s)</span>
      </footer>
    </article>
  );
}
