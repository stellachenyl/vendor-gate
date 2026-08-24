"use client";

import { useMemo, useState } from "react";
import { AuditScheduler } from "@/components/quality/AuditScheduler";
import { AuditStatusBadge } from "@/components/quality/StatusBadge";
import { DataTable } from "@/components/data/DataTable";
import { audits } from "@/lib/mock-data";
import { useRole } from "@/lib/role-context";
import type { AuditEntry } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export default function AuditsPage() {
  const { canView, role } = useRole();

  const visible = useMemo(
    () => audits.filter((a) => !a.supplierId || canView(a.supplierId)),
    [canView],
  );
  const upcoming = useMemo(
    () =>
      [...visible]
        .filter((a) => a.status === "Scheduled" || a.status === "In Progress")
        .sort((a, b) => a.date.localeCompare(b.date)),
    [visible],
  );

  const columns = [
    {
      key: "id",
      header: "Audit ID",
      render: (row: AuditEntry) => (
        <span className="font-mono font-semibold">{row.id}</span>
      ),
    },
    { key: "type", header: "Type" },
    { key: "auditor", header: "Auditor" },
    { key: "location", header: "Location" },
    {
      key: "date",
      header: "Date",
      value: (row: AuditEntry) => row.date,
      render: (row: AuditEntry) => (
        <span className="font-mono">{formatDate(row.date)}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      value: (row: AuditEntry) => row.status,
      render: (row: AuditEntry) => <AuditStatusBadge status={row.status} />,
    },
  ];

  return (
    <>
      <div className="mb-5">
        <h1 className="page-title">Audit Program</h1>
        <p className="mt-0.5 text-sm text-slate-500">
          {role} view · Internal system and process audits plus third-party surveillance
          under IATF 16949 §9.2. Findings are logged as NCRs or continuous improvement
          items.
        </p>
      </div>

      <section aria-label="Next audits" className="mb-6 grid gap-3 sm:grid-cols-3">
        {upcoming.slice(0, 3).map((a) => (
          <div key={a.id} className="card p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-xs font-bold text-slate-500">{a.id}</span>
              <AuditStatusBadge status={a.status} />
            </div>
            <p className="mt-1.5 text-sm font-semibold text-slate-800">{a.type}</p>
            <p className="font-mono text-xs text-slate-500">{formatDate(a.date)}</p>
            <p className="mt-1 text-xs text-slate-500">
              {a.location} · Auditor: {a.auditor}
            </p>
          </div>
        ))}
      </section>

      <AuditScheduler audits={visible} />

      <section className="mt-6" aria-label="Full audit history">
        <DataTable
          columns={columns}
          data={[...visible].sort((a, b) => b.date.localeCompare(a.date))}
          rowKey={(a) => a.id}
          csvFilename="audit-program.csv"
          caption="Complete Audit Register"
        />
      </section>
    </>
  );
}
