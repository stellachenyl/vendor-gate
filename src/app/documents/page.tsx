"use client";

import { DocumentVault } from "@/components/quality/DocumentVault";
import { documents } from "@/lib/mock-data";
import { useRole } from "@/lib/role-context";

export default function DocumentsPage() {
  const { role } = useRole();

  return (
    <>
      <div className="mb-5">
        <h1 className="page-title">Document Vault</h1>
        <p className="mt-0.5 text-sm text-slate-500">
          {role} view · Controlled supplier documents with version history and approval
          workflow. Superseded revisions are archived automatically and remain traceable
          for audits.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
        <DocumentVault documents={documents} />

        <aside className="space-y-4">
          <div className="card p-4">
            <h2 className="text-sm font-semibold text-slate-800">Submission Checklist</h2>
            <ul className="mt-2 list-disc space-y-1.5 pl-4 text-xs leading-relaxed text-slate-600">
              <li>PPAP Level 3 for all new part numbers and engineering changes.</li>
              <li>
                Control Plan and PFMEA updated within 30 days of any process change.
              </li>
              <li>Calibration certificates current within 12 months.</li>
              <li>IMDS entries submitted before first shipment of new materials.</li>
            </ul>
          </div>
          <div className="card border-status-pending/40 p-4">
            <h2 className="text-sm font-semibold text-slate-800">Pending Approvals</h2>
            <p className="mt-1 font-mono text-3xl font-bold text-status-pending">
              {documents.filter((d) => d.approvalStatus === "Pending Review").length}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Target review turnaround: 5 business days from upload.
            </p>
          </div>
        </aside>
      </div>
    </>
  );
}
