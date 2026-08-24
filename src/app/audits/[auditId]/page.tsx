"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { AuditStatusBadge } from "@/components/quality/StatusBadge";
import { audits, getSupplier } from "@/lib/mock-data";
import { formatDate } from "@/lib/utils";

export default function AuditDetailPage() {
  const params = useParams<{ auditId: string }>();
  const audit = audits.find((a) => a.id === params.auditId);

  if (!audit) {
    return (
      <div className="card mx-auto max-w-lg p-10 text-center" role="alert">
        <h1 className="text-base font-semibold text-slate-900">Audit not found</h1>
        <Link href="/audits" className="mt-4 inline-block text-sm font-medium text-accent hover:underline">
          ← Back to audit program
        </Link>
      </div>
    );
  }

  const supplier = audit.supplierId ? getSupplier(audit.supplierId) : undefined;

  return (
    <>
      <nav aria-label="Breadcrumb" className="mb-3 text-xs text-slate-400">
        <Link href="/audits" className="hover:text-accent hover:underline">
          Audits
        </Link>{" "}
        / <span className="font-mono">{audit.id}</span>
      </nav>

      <header className="card mb-5 flex flex-wrap items-start justify-between gap-3 p-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-mono text-lg font-bold text-slate-900">{audit.id}</h1>
            <AuditStatusBadge status={audit.status} />
          </div>
          <p className="mt-1 text-sm font-semibold text-slate-800">{audit.type}</p>
          <p className="text-xs text-slate-500">
            {supplier ? (
              <Link href={`/suppliers/${supplier.id}`} className="text-accent hover:underline">
                {supplier.name}
              </Link>
            ) : (
              "Internal — Totalonics Quality"
            )}{" "}
            · {audit.location}
          </p>
        </div>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-1 text-right text-xs text-slate-500">
          <dt>Date</dt>
          <dd className="font-mono">{formatDate(audit.date)}</dd>
          <dt>Lead auditor</dt>
          <dd className="font-medium text-slate-700">{audit.auditor}</dd>
          <dt>Findings</dt>
          <dd className="font-mono">{audit.findingsCount ?? 0}</dd>
        </dl>
      </header>

      <div className="grid gap-5 lg:grid-cols-2">
        <section aria-label="Audit scope and reference" className="card p-5">
          <h2 className="mb-2 text-sm font-semibold text-slate-800">Scope &amp; Reference</h2>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Scope</dt>
              <dd className="mt-0.5 leading-relaxed text-slate-700">
                {audit.scope ?? "Full QMS coverage per annual plan."}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Checklist reference
              </dt>
              <dd className="mt-0.5 font-mono text-xs text-slate-700">
                {audit.checklistRef ?? "Standard checklist"}
              </dd>
            </div>
          </dl>
        </section>

        <section aria-label="Team assignment" className="card p-5">
          <h2 className="mb-2 text-sm font-semibold text-slate-800">Team Assignment</h2>
          {audit.team && audit.team.length > 0 ? (
            <ul role="list" className="list-inside list-disc space-y-1 text-sm text-slate-700">
              {audit.team.map((member) => (
                <li key={member}>{member}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-400">Team not yet assigned.</p>
          )}
        </section>

        <section aria-label="Findings summary" className="card p-5 lg:col-span-2">
          <h2 className="mb-2 text-sm font-semibold text-slate-800">
            Findings Summary{" "}
            <span className="font-mono font-normal text-slate-400">
              ({audit.findingsCount ?? 0})
            </span>
          </h2>
          <p className="text-sm leading-relaxed text-slate-700">
            {audit.findingsSummary ?? "No findings recorded — audit not yet executed."}
          </p>
          <div className="mt-4 border-t border-line pt-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Closure status
            </h3>
            <p
              className={
                audit.closureStatus === "Closed"
                  ? "mt-1 inline-flex rounded-full border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700"
                  : "mt-1 inline-flex rounded-full border border-red-300 bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700"
              }
            >
              Findings {audit.closureStatus ?? "N/A"}
            </p>
          </div>
        </section>
      </div>
    </>
  );
}

// Local import kept below component for readability; aliased to avoid shadowing.


