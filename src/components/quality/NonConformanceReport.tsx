import type { NonConformanceReport } from "@/lib/types";
import { getSupplier } from "@/lib/mock-data";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { PriorityBadge, RiskTierBadge } from "./PriorityBadge";
import { StatusBadge } from "./StatusBadge";

function EightDTracker({
  progress,
}: {
  progress: NonConformanceReport["eightDProgress"];
}) {
  const doneCount = progress.filter((s) => s.done).length;
  return (
    <div
      role="group"
      aria-label={`8D progress: ${doneCount} of ${progress.length} steps complete`}
    >
      <ol className="flex flex-wrap gap-x-1 gap-y-2">
        {progress.map((step, i) => (
          <li key={step.step} className="flex min-w-[72px] flex-1 items-center">
            <div className="flex w-full flex-col items-center text-center">
              <span
                aria-hidden
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full border-2 text-[10px] font-bold",
                  step.done
                    ? "border-status-approved bg-status-approved text-white"
                    : "border-line bg-slate-50 text-slate-400",
                )}
              >
                {step.step.replace("D", "")}
              </span>
              <span
                className={cn(
                  "mt-1 text-[10px] leading-tight",
                  step.done ? "text-slate-700" : "text-slate-400",
                )}
              >
                {step.label}
              </span>
            </div>
            {i < progress.length - 1 ? (
              <span
                aria-hidden
                className={cn(
                  "mx-0.5 mb-4 h-0.5 flex-1 rounded",
                  step.done ? "bg-status-approved" : "bg-line",
                )}
              />
            ) : null}
          </li>
        ))}
      </ol>
      <p className="sr-only">{`${doneCount} of 8D steps complete`}</p>
    </div>
  );
}

export function NonConformanceReportCard({ ncr }: { ncr: NonConformanceReport }) {
  const supplier = getSupplier(ncr.supplierId);

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
          </div>
          <p className="mt-1 text-sm font-semibold text-slate-800">{ncr.title}</p>
          <p className="font-mono text-xs text-slate-500">
            P/N {ncr.partNumber} · <RiskTierBadge tier={supplier?.riskTier ?? "Medium"} />{" "}
            <span className="ml-1 align-middle">{supplier?.name ?? ncr.supplierId}</span>
          </p>
        </div>
        <div className="text-right text-xs text-slate-500">
          Raised {formatDate(ncr.raisedDate)}
          <br />
          <span className="font-mono">
            Qty affected: {ncr.quantityAffected.toLocaleString()}
          </span>
          <br />
          <span className="font-mono">
            Cost impact: {formatCurrency(ncr.costImpactUsd)}
          </span>
        </div>
      </header>

      <EightDTracker progress={ncr.eightDProgress} />

      <dl className="mt-4 space-y-3 border-t border-line pt-3 text-sm">
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Defect Description
          </dt>
          <dd className="mt-0.5 leading-relaxed text-slate-700">
            {ncr.defectDescription}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Containment Action
          </dt>
          <dd className="mt-0.5 leading-relaxed text-slate-700">
            {ncr.containmentAction || "Pending assignment."}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Root Cause
          </dt>
          <dd className="mt-0.5 leading-relaxed text-slate-700">
            {ncr.rootCause || "Under investigation — D4 in progress."}
          </dd>
        </div>
      </dl>

      <footer className="mt-3 font-mono text-xs text-slate-400">
        Raised by {ncr.raisedBy}
      </footer>
    </article>
  );
}
