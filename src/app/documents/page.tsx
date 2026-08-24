"use client";

import { useMemo, useState } from "react";
import { DataTable } from "@/components/data/DataTable";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/FormControls";
import { useToast } from "@/components/ui/Toast";
import { ApprovalStatusBadge } from "@/components/quality/StatusBadge";
import { UploadZoneCard } from "@/components/quality/UploadZone";
import { documents as seedDocuments, suppliers } from "@/lib/mock-data";
import { useRole } from "@/lib/role-context";
import type { ApprovalStatus, DocType, VaultDocument } from "@/lib/types";

const DOC_TYPES: Array<DocType | "All"> = [
  "All",
  "Certificate",
  "PPAP",
  "Audit Report",
  "SOP",
];
const STATUSES: Array<ApprovalStatus | "All"> = ["All", "Approved", "Pending", "Rejected"];

function formatSize(kb: number): string {
  return kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`;
}

export default function DocumentsPage() {
  const { canView, role } = useRole();
  const { showToast } = useToast();
  const isManager = role === "Quality Manager";

  const [docs, setDocs] = useState<VaultDocument[]>(seedDocuments);
  const [typeFilter, setTypeFilter] = useState<DocType | "All">("All");
  const [statusFilter, setStatusFilter] = useState<ApprovalStatus | "All">("All");
  const [supplierFilter, setSupplierFilter] = useState("All");
  const [previewDoc, setPreviewDoc] = useState<VaultDocument | null>(null);

  const filtered = useMemo(
    () =>
      docs
        .filter((d) => canView(d.supplierId))
        .filter((d) => {
          if (typeFilter !== "All" && d.docType !== typeFilter) return false;
          if (statusFilter !== "All" && d.approvalStatus !== statusFilter) return false;
          if (supplierFilter !== "All" && d.supplierId !== supplierFilter) return false;
          return true;
        })
        .sort((a, b) => b.uploadedDate.localeCompare(a.uploadedDate)),
    [docs, canView, typeFilter, statusFilter, supplierFilter],
  );

  const setApproval = (doc: VaultDocument, approvalStatus: ApprovalStatus) => {
    setDocs((prev) => prev.map((d) => (d.id === doc.id ? { ...d, approvalStatus } : d)));
    showToast(
      `${doc.id} marked ${approvalStatus.toLowerCase()}.`,
      approvalStatus === "Approved" ? "success" : "error",
    );
    if (previewDoc?.id === doc.id) {
      setPreviewDoc({ ...doc, approvalStatus });
    }
  };

  const columns = [
    {
      key: "name",
      header: "Document Name",
      render: (row: VaultDocument) => (
        <button
          type="button"
          className="text-left font-medium text-accent hover:underline"
          onClick={() => setPreviewDoc(row)}
        >
          {row.name}
        </button>
      ),
    },
    {
      key: "docType",
      header: "Type",
      value: (row: VaultDocument) => row.docType,
      render: (row: VaultDocument) => (
        <span className="rounded border border-line bg-slate-50 px-1.5 py-0.5 text-xs font-medium text-slate-600">
          {row.docType}
        </span>
      ),
    },
    {
      key: "supplierId",
      header: "Supplier",
      value: () => "",
      render: (row: VaultDocument) => (
        <span className="text-sm text-slate-600">
          {suppliers.find((s) => s.id === row.supplierId)?.code ?? "—"}
        </span>
      ),
    },
    {
      key: "uploadedDate",
      header: "Upload Date",
      value: (row: VaultDocument) => row.uploadedDate,
      render: (row: VaultDocument) => (
        <span className="font-mono text-xs">{row.uploadedDate}</span>
      ),
    },
    {
      key: "version",
      header: "Version",
      render: (row: VaultDocument) => <span className="font-mono text-xs">{row.version}</span>,
    },
    {
      key: "approvalStatus",
      header: "Status",
      value: (row: VaultDocument) => row.approvalStatus,
      render: (row: VaultDocument) => <ApprovalStatusBadge status={row.approvalStatus} />,
    },
    {
      key: "actions",
      header: "Actions",
      sortable: false,
      render: (row: VaultDocument) => (
        <div className="flex flex-wrap gap-1.5">
          <Button size="sm" variant="ghost" onClick={() => setPreviewDoc(row)}>
            Preview
          </Button>
          {isManager && row.approvalStatus === "Pending" ? (
            <>
              <Button size="sm" onClick={() => setApproval(row, "Approved")}>
                Approve
              </Button>
              <Button size="sm" variant="danger" onClick={() => setApproval(row, "Rejected")}>
                Reject
              </Button>
            </>
          ) : null}
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="page-title">Document Vault</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            {role} view · Controlled supplier documents with version history and approval
            workflow. Superseded revisions stay traceable for audits.
          </p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
        <div>
          {/* Filters */}
          <form
            aria-label="Document filters"
            onSubmit={(e) => e.preventDefault()}
            className="card mb-4 grid gap-3 p-4 sm:grid-cols-3"
          >
            <Select
              aria-label="Filter by document type"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as DocType | "All")}
              options={DOC_TYPES.map((t) => ({
                value: t,
                label: t === "All" ? "All types" : t,
              }))}
            />
            <Select
              aria-label="Filter by supplier"
              value={supplierFilter}
              onChange={(e) => setSupplierFilter(e.target.value)}
              options={[
                { value: "All", label: "All suppliers" },
                ...suppliers.map((s) => ({ value: s.id, label: `${s.name} (${s.code})` })),
              ]}
            />
            <Select
              aria-label="Filter by approval status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ApprovalStatus | "All")}
              options={STATUSES.map((s) => ({
                value: s,
                label: s === "All" ? "All statuses" : s,
              }))}
            />
          </form>

          <DataTable
            columns={columns}
            data={filtered}
            rowKey={(d) => d.id}
            pageSize={8}
            csvFilename="document-register.csv"
            caption={`Controlled Documents (${filtered.length})`}
          />
        </div>

        <aside className="space-y-4">
          <UploadZoneCard />
          <div className="card p-4">
            <h2 className="text-sm font-semibold text-slate-800">Submission Checklist</h2>
            <ul className="mt-2 list-disc space-y-1.5 pl-4 text-xs leading-relaxed text-slate-600">
              <li>PPAP Level 3 for new part numbers and engineering changes.</li>
              <li>Control Plan and PFMEA updated within 30 days of process changes.</li>
              <li>Calibration certificates current within 12 months.</li>
              <li>IMDS entries submitted before first shipment of new materials.</li>
            </ul>
          </div>
          <div className="card p-4">
            <h2 className="text-sm font-semibold text-slate-800">Pending Approvals</h2>
            <p className="mt-1 font-mono text-3xl font-bold text-status-pending">
              {docs.filter((d) => d.approvalStatus === "Pending").length}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Target review turnaround: 5 business days.
            </p>
          </div>
        </aside>
      </div>

      {/* Preview modal */}
      <Modal
        open={previewDoc !== null}
        onClose={() => setPreviewDoc(null)}
        title={previewDoc?.name ?? ""}
        description="Document preview is a placeholder in this demo build."
        footer={
          previewDoc && isManager && previewDoc.approvalStatus === "Pending" ? (
            <>
              <Button variant="danger" onClick={() => setApproval(previewDoc, "Rejected")}>
                Reject
              </Button>
              <Button onClick={() => setApproval(previewDoc, "Approved")}>Approve</Button>
            </>
          ) : undefined
        }
      >
        {previewDoc ? (
          <dl className="grid grid-cols-[130px_1fr] gap-x-3 gap-y-2 text-sm">
            <dt className="font-medium text-slate-500">Document ID</dt>
            <dd className="font-mono">{previewDoc.id}</dd>
            <dt className="font-medium text-slate-500">Type</dt>
            <dd>{previewDoc.docType}</dd>
            <dt className="font-medium text-slate-500">Supplier</dt>
            <dd>
              {suppliers.find((s) => s.id === previewDoc.supplierId)?.name ?? previewDoc.supplierId}
            </dd>
            <dt className="font-medium text-slate-500">Version</dt>
            <dd className="font-mono">{previewDoc.version}</dd>
            <dt className="font-medium text-slate-500">Uploaded</dt>
            <dd>
              <span className="font-mono">{previewDoc.uploadedDate}</span> by{" "}
              {previewDoc.uploadedBy}
            </dd>
            <dt className="font-medium text-slate-500">Size</dt>
            <dd className="font-mono">{formatSize(previewDoc.sizeKb)}</dd>
            <dt className="font-medium text-slate-500">Status</dt>
            <dd>
              <ApprovalStatusBadge status={previewDoc.approvalStatus} />
            </dd>
          </dl>
        ) : null}
      </Modal>
    </>
  );
}
