"use client";

import Link from "next/link";
import { SupplierScorecard } from "@/components/quality/SupplierScorecard";
import { PriorityBadge } from "@/components/quality/PriorityBadge";
import { StatusBadge, AuditStatusBadge } from "@/components/quality/StatusBadge";
import { UploadZoneCard } from "@/components/quality/UploadZone";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  addDays,
  audits,
  documents,
  getSupplier,
  inspections,
  ncrs,
} from "@/lib/mock-data";
import { useRole } from "@/lib/role-context";
import { formatDate } from "@/lib/utils";

/** Demo supplier account used for the self-service portal. */
const PORTAL_SUPPLIER_ID = "SUP-003";

export default function SupplierPortalView() {
  const { role } = useRole();
  const supplier = getSupplier(PORTAL_SUPPLIER_ID)!;

  const myNcrs = ncrs.filter((n) => n.supplierId === supplier.id);
  const openNcrs = myNcrs.filter((n) => n.status !== "Closed");
  const myInspections = inspections.filter((i) => i.supplierId === supplier.id);
  const passRate =
    Math.round(
      (myInspections.reduce(
        (acc, i) => acc + (i.passCount / Math.max(i.sampleSize, 1)) * 100,
        0,
      ) /
        Math.max(myInspections.length, 1)) *
        10,
    ) / 10;
  const myAudits = audits.filter(
    (a) => a.supplierId === supplier.id && a.status !== "Completed",
  );
  const responseDue = addDays(
    openNcrs[0]?.raisedDate ?? new Date().toISOString().slice(0, 10),
    14,
  );

  return (
    <>
      <div className="mb-5">
        <h1 className="page-title">Supplier Self-Service Portal</h1>
        <p className="mt-0.5 text-sm text-slate-500">
          Welcome, {supplier.name} ·{" "}
          {role === "Quality Manager"
            ? `Quality Manager preview of the ${supplier.code} account`
            : "your quality performance at a glance"}
          .
        </p>
      </div>

      <section aria-label="Your performance" className="mb-5 grid gap-5 lg:grid-cols-[320px_1fr]">
        <SupplierScorecard supplier={supplier} />
        <div className="grid content-start gap-3 sm:grid-cols-3">
          <div className="card p-4 text-center">
            <p className="text-xs uppercase tracking-wide text-slate-500">Goods-In Pass Rate</p>
            <p
              data-tone={passRate >= 95 ? "positive" : "warning"}
              className={`mt-1 font-mono text-2xl font-bold ${
                passRate >= 95 ? "text-status-approved" : "text-status-conditional"
              }`}
            >
              {passRate}%
            </p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-xs uppercase tracking-wide text-slate-500">Open NCRs</p>
            <p className="mt-1 font-mono text-2xl font-bold text-slate-900">{openNcrs.length}</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-xs uppercase tracking-wide text-slate-500">PPM Defects</p>
            <p className="mt-1 font-mono text-2xl font-bold text-slate-900">
              {supplier.ppmDefects.toLocaleString()}
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-5">
          <section aria-label="Open NCRs assigned to you" aria-labelledby="portal-ncrs">
            <h2 id="portal-ncrs" className="mb-2 text-sm font-semibold text-slate-800">
              Open NCRs Requiring Your Response
            </h2>
            {openNcrs.length === 0 ? (
              <EmptyState
                title="No non-conformance reports."
                hint="Quality is on track! ✅"
              />
            ) : (
              <ul role="list" className="space-y-2">
                {openNcrs.map((ncr) => {
                  const dueDate = addDays(ncr.raisedDate, 14);
                  return (
                    <li key={ncr.id}>
                      <Link
                        href={`/ncrs/${ncr.id}`}
                        className="card flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 hover:bg-accent-soft/40"
                      >
                        <span className="font-mono text-sm font-bold text-accent">{ncr.id}</span>
                        <PriorityBadge priority={ncr.priority} />
                        <StatusBadge status={ncr.status} />
                        <span className="min-w-0 flex-1 truncate text-sm text-slate-600">
                          {ncr.title}
                        </span>
                        <span className="font-mono text-xs text-slate-500">
                          Respond by {formatDate(dueDate)}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
            <p className="mt-2 text-xs text-slate-400">
              Response deadline is 14 calendar days from raise date.
            </p>
          </section>

          <section aria-label="Upload certificates and evidence">
            <UploadZoneCard />
          </section>

          <section aria-label="Document submissions">
            <ul role="list" className="space-y-1.5">
              {documents
                .filter((d) => d.supplierId === supplier.id)
                .map((d) => (
                  <li key={d.id} className="card flex items-center justify-between px-4 py-2 text-xs">
                    <span className="truncate text-slate-700">{d.name}</span>
                    <span
                      className={
                        d.approvalStatus === "Approved"
                          ? "rounded-full border border-emerald-300 bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-700"
                          : d.approvalStatus === "Rejected"
                            ? "rounded-full border border-red-300 bg-red-50 px-2 py-0.5 font-semibold text-red-700"
                            : "rounded-full border border-indigo-300 bg-indigo-50 px-2 py-0.5 font-semibold text-indigo-700"
                      }
                    >
                      {d.approvalStatus}
                    </span>
                  </li>
                ))}
              {documents.filter((d) => d.supplierId === supplier.id).length === 0 ? (
                <li>
                  <EmptyState title="No documents uploaded yet." />
                </li>
              ) : null}
            </ul>
          </section>
        </div>

        <aside className="space-y-5">
          <section aria-label="Upcoming audits for your site">
            <h2 className="mb-2 text-sm font-semibold text-slate-800">Your Upcoming Audits</h2>
            {myAudits.length === 0 ? (
              <EmptyState title="No audits planned for your site right now." />
            ) : (
              <ul role="list" className="space-y-2">
                {myAudits.map((a) => (
                  <li key={a.id} className="card px-4 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-bold text-slate-700">
                        {formatDate(a.date)}
                      </span>
                      <AuditStatusBadge status={a.status} />
                    </div>
                    <p className="mt-0.5 text-sm font-medium text-slate-700">{a.type}</p>
                    <p className="text-xs text-slate-500">Lead auditor: {a.auditor}</p>
                    {a.scope ? (
                      <p className="mt-1 text-xs leading-relaxed text-slate-500">Scope: {a.scope}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section aria-label="Quality team contact information" className="card p-4">
            <h2 className="mb-2 text-sm font-semibold text-slate-800">Your Quality Team</h2>
            <dl className="space-y-1 text-sm text-slate-600">
              <dt className="font-medium text-slate-700">SQE Lead</dt>
              <dd>M. Delgado · m.delgado@acme.com</dd>
              <dt className="pt-1 font-medium text-slate-700">Quality Manager</dt>
              <dd>Dana Reyes · d.reyes@acme.com</dd>
              <dt className="pt-1 font-medium text-slate-700">Escalations</dt>
              <dd>
                <a href="mailto:quality@acme.com" className="text-accent hover:underline">
                  quality@acme.com
                </a>
              </dd>
            </dl>
          </section>

          {role === "Quality Manager" ? (
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-md border border-line bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Back to manager dashboard
            </Link>
          ) : null}
        </aside>
      </div>
    </>
  );
}
