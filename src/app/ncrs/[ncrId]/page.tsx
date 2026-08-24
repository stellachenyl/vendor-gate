"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { EightDStepper } from "@/components/quality/EightDStepper";
import { ActivityTimeline } from "@/components/quality/ActivityTimeline";
import { PriorityBadge, RiskTierBadge } from "@/components/quality/PriorityBadge";
import { StatusBadge } from "@/components/quality/StatusBadge";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/FormControls";
import { useToast } from "@/components/ui/Toast";
import { getNcr, getSupplier } from "@/lib/mock-data";
import { useRole } from "@/lib/role-context";
import { cn, daysSince, formatCurrency, formatDate } from "@/lib/utils";

export default function NcrDetailPage() {
  const params = useParams<{ ncrId: string }>();
  const { role } = useRole();
  const { showToast } = useToast();
  const isManager = role === "Quality Manager";

  const ncr = getNcr(params.ncrId);
  const [rootCauseDraft, setRootCauseDraft] = useState(ncr?.rootCause ?? "");
  const [containmentNotes, setContainmentNotes] = useState("");
  const [verifiedByMe, setVerifiedByMe] = useState(false);
  const [closedByMe, setClosedByMe] = useState(false);

  if (!ncr) {
    return (
      <div className="card mx-auto max-w-lg p-10 text-center">
        <h1 className="text-base font-semibold text-slate-900">NCR not found</h1>
        <p className="mt-1 text-sm text-slate-500">
          This nonconformance report does not exist.
        </p>
        <Link href="/ncrs" className="mt-4 inline-block text-sm font-medium text-accent hover:underline">
          ← Back to all NCRs
        </Link>
      </div>
    );
  }

  const supplier = getSupplier(ncr.supplierId);
  const todayIso = new Date().toISOString().slice(0, 10);
  const isVerified = Boolean(ncr.verification) || verifiedByMe;
  const isClosed = Boolean(ncr.closure) || closedByMe;

  return (
    <>
      <nav aria-label="Breadcrumb" className="mb-3 text-xs text-slate-400">
        <Link href="/ncrs" className="hover:text-accent hover:underline">
          NCRs
        </Link>{" "}
        / <span className="font-mono">{ncr.id}</span>
      </nav>

      {/* Header */}
      <header className="card mb-5 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-mono text-lg font-bold text-slate-900">{ncr.id}</h1>
              <PriorityBadge priority={ncr.priority} />
              <StatusBadge status={isClosed ? "Closed" : ncr.status} />
            </div>
            <p className="mt-1 text-sm font-semibold text-slate-800">{ncr.title}</p>
            <p className="mt-0.5 font-mono text-xs text-slate-500">
              P/N {ncr.partNumber}
              {ncr.lotNumber ? ` · Lot ${ncr.lotNumber}` : ""} ·{" "}
              <RiskTierBadge tier={supplier?.riskTier ?? "Medium"} />{" "}
              <Link
                href={`/suppliers/${ncr.supplierId}`}
                className="ml-1 align-middle font-sans text-accent hover:underline"
              >
                {supplier?.name ?? ncr.supplierId}
              </Link>
            </p>
          </div>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-1 text-right text-xs text-slate-500">
            <dt>Raised</dt>
            <dd className="font-mono">{formatDate(ncr.raisedDate)}</dd>
            <dt>Days open</dt>
            <dd
              className={cn(
                "font-mono font-semibold",
                daysSince(ncr.raisedDate) > 30 && !isClosed ? "text-status-rejected" : "text-slate-800",
              )}
            >
              {daysSince(ncr.raisedDate)}
            </dd>
            <dt>Engineer</dt>
            <dd className="font-medium text-slate-700">{ncr.assignedEngineer}</dd>
            <dt>Qty affected</dt>
            <dd className="font-mono">{ncr.quantityAffected.toLocaleString()}</dd>
            <dt>Cost impact</dt>
            <dd className="font-mono">{formatCurrency(ncr.costImpactUsd)}</dd>
          </dl>
        </div>
      </header>

      {/* Full 8D tracker */}
      <section aria-label="8D progress tracker" className="card mb-5 p-5">
        <h2 className="mb-4 text-sm font-semibold text-slate-800">8D Progress</h2>
        <EightDStepper progress={ncr.eightDProgress} size="lg" />
        <p className="mt-3 font-mono text-xs text-slate-400">
          Team: {ncr.eightDTeam.join(" · ")}
        </p>
      </section>

      <div className="grid gap-5 lg:grid-cols-[1.7fr_1fr]">
        {/* Left column */}
        <div className="space-y-5">
          <section aria-label="Defect description" className="card p-5">
            <h2 className="mb-2 text-sm font-semibold text-slate-800">Defect Description (D2)</h2>
            <p className="text-sm leading-relaxed text-slate-700">{ncr.defectDescription}</p>
          </section>

          <section aria-label="Containment evidence" className="card p-5">
            <h2 className="mb-2 text-sm font-semibold text-slate-800">
              Containment Action &amp; Evidence (D3)
            </h2>
            <p className="text-sm leading-relaxed text-slate-700">{ncr.containmentAction}</p>
            {ncr.containmentEvidence.length > 0 ? (
              <ul role="list" className="mt-3 space-y-1">
                {ncr.containmentEvidence.map((e) => (
                  <li key={e} className="font-mono text-xs text-accent">
                    📎 {e}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-xs text-slate-400">No evidence files attached.</p>
            )}
            <div className="mt-3 border-t border-line pt-3">
              <Textarea
                label="Add containment note"
                rows={2}
                value={containmentNotes}
                onChange={(e) => setContainmentNotes(e.target.value)}
                placeholder="Record additional containment observations…"
              />
              <div className="mt-2 flex justify-end">
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={containmentNotes.trim() === ""}
                  onClick={() => {
                    setContainmentNotes("");
                    showToast("Containment note recorded.", "success");
                  }}
                >
                  Save Note
                </Button>
              </div>
            </div>
          </section>

          <section aria-label="Root cause analysis" className="card p-5">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-slate-800">Root Cause Analysis (D4)</h2>
              {ncr.rootCauseCategory ? (
                <span className="rounded-full border border-indigo-300 bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700">
                  {ncr.rootCauseCategory}
                </span>
              ) : (
                <span className="rounded-full border border-slate-300 bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500">
                  Category pending
                </span>
              )}
            </div>
            <Textarea
              label="Root cause statement"
              rows={3}
              value={rootCauseDraft}
              onChange={(e) => setRootCauseDraft(e.target.value)}
              placeholder="Use 5-Why or fishbone output to describe the escape and systemic cause…"
            />
            <div className="mt-2 flex justify-end">
              <Button
                size="sm"
                disabled={!isManager || rootCauseDraft.trim() === ""}
                onClick={() => showToast("Root cause saved to the 8D record.", "success")}
              >
                Save Root Cause
              </Button>
            </div>
            {!isManager ? (
              <p className="mt-1 text-xs text-slate-400">
                Only the assigned Quality Manager can edit the root cause record.
              </p>
            ) : null}
          </section>

          <section aria-label="Corrective action plan" className="card p-5">
            <h2 className="mb-3 text-sm font-semibold text-slate-800">
              Corrective Action Plan (D5–D7)
            </h2>
            {ncr.correctiveActions.length === 0 ? (
              <p className="text-sm text-slate-400">No corrective actions defined yet.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-slate-500">
                    <th scope="col" className="pb-2 pr-3">Action</th>
                    <th scope="col" className="pb-2 pr-3">Owner</th>
                    <th scope="col" className="pb-2 pr-3">Due</th>
                    <th scope="col" className="pb-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {ncr.correctiveActions.map((ca) => {
                    const overdue = ca.dueDate < todayIso && ca.status !== "Done";
                    return (
                      <tr key={ca.id} className="border-b border-line last:border-b-0 align-top">
                        <td className="py-2 pr-3 leading-relaxed text-slate-700">{ca.action}</td>
                        <td className="py-2 pr-3 text-slate-600">{ca.owner}</td>
                        <td className="py-2 pr-3">
                          <span className={cn("font-mono text-xs", overdue && "font-bold text-red-600")}>
                            {formatDate(ca.dueDate)}
                            {overdue ? " ⚠" : ""}
                          </span>
                        </td>
                        <td className="py-2">
                          <span
                            className={cn(
                              "rounded-full border px-2 py-0.5 text-xs font-semibold",
                              ca.status === "Done" &&
                                "border-emerald-300 bg-emerald-50 text-emerald-700",
                              ca.status === "In Progress" &&
                                "border-blue-300 bg-blue-50 text-blue-700",
                              ca.status === "Planned" &&
                                "border-slate-300 bg-slate-100 text-slate-600",
                            )}
                          >
                            {ca.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            {/* Verification & closure sign-off */}
            <div className="mt-5 grid gap-3 border-t border-line pt-4 sm:grid-cols-2">
              <div className="rounded-md border border-line p-3">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Verification Sign-off (D6)
                </h3>
                {ncr.verification ? (
                  <p className="mt-1 text-sm text-slate-700">
                    Verified by <span className="font-semibold">{ncr.verification.by}</span> on{" "}
                    <span className="font-mono text-xs">{formatDate(ncr.verification.date)}</span>
                  </p>
                ) : isVerified ? (
                  <p className="mt-1 text-sm font-medium text-status-approved">
                    ✓ Verified by you (session draft)
                  </p>
                ) : (
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={!isManager}
                    onClick={() => {
                      setVerifiedByMe(true);
                      showToast("Verification recorded for this session (demo).", "success");
                    }}
                  >
                    Record Verification
                  </Button>
                )}
              </div>
              <div className="rounded-md border border-line p-3">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Closure Sign-off (D8)
                </h3>
                {ncr.closure ? (
                  <p className="mt-1 text-sm text-slate-700">
                    Closed by <span className="font-semibold">{ncr.closure.by}</span> on{" "}
                    <span className="font-mono text-xs">{formatDate(ncr.closure.date)}</span>
                  </p>
                ) : isClosed ? (
                  <p className="mt-1 text-sm font-medium text-status-approved">
                    ✓ Closed by you (session draft)
                  </p>
                ) : (
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={!isManager || !isVerified}
                    onClick={() => {
                      setClosedByMe(true);
                      showToast("NCR closed for this session (demo).", "success");
                    }}
                  >
                    Close NCR
                  </Button>
                )}
                {!isVerified && !ncr.closure && isManager ? (
                  <p className="mt-1 text-xs text-slate-400">Verification required before closure.</p>
                ) : null}
              </div>
            </div>
          </section>
        </div>

        {/* Right column: activity log */}
        <aside aria-label="Activity log timeline" className="card h-fit p-5">
          <h2 className="mb-4 text-sm font-semibold text-slate-800">Activity Log</h2>
          <ActivityTimeline entries={ncr.activityLog} />
        </aside>
      </div>
    </>
  );
}
