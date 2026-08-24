"use client";

import { useMemo, useState } from "react";
import type { ApprovalStatus, VaultDocument } from "@/lib/types";
import { ApprovalStatusBadge } from "./StatusBadge";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/FormControls";
import { useToast } from "@/components/ui/Toast";
import { formatDate } from "@/lib/utils";

const FILE_ICONS: Record<VaultDocument["fileType"], string> = {
  pdf: "PDF",
  xlsx: "XLS",
  docx: "DOC",
};

function formatSize(kb: number): string {
  return kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`;
}

export function DocumentVault({
  documents,
}: {
  documents: ReadonlyArray<VaultDocument>;
}) {
  const { showToast } = useToast();
  const [filter, setFilter] = useState<"all" | ApprovalStatus>("all");

  const filtered = useMemo(
    () =>
      filter === "all" ? documents : documents.filter((d) => d.approvalStatus === filter),
    [documents, filter],
  );

  return (
    <div className="rounded-lg border border-line bg-card shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
        <h3 className="text-sm font-semibold text-slate-800">
          Controlled Documents{" "}
          <span className="font-mono font-normal text-slate-400">
            ({filtered.length})
          </span>
        </h3>
        <div className="flex items-end gap-2">
          <Select
            aria-label="Filter by approval status"
            value={filter}
            onChange={(e) => setFilter(e.target.value as typeof filter)}
            options={[
              { value: "all", label: "All statuses" },
              { value: "Approved", label: "Approved" },
              { value: "Pending", label: "Pending" },
              { value: "Rejected", label: "Rejected" },
            ]}
            className="!w-44 !py-1.5"
          />
          <Button
            size="sm"
            onClick={() =>
              showToast("Upload dialog queued for PPAP coordinator review.", "info")
            }
          >
            Upload
          </Button>
        </div>
      </div>

      <ul role="list" className="divide-y divide-line">
        {filtered.map((doc) => (
          <li
            key={doc.id}
            className="flex items-center gap-4 px-4 py-3 hover:bg-accent-soft/30"
          >
            <span
              aria-hidden
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-line bg-slate-50 font-mono text-[10px] font-bold text-slate-500"
            >
              {FILE_ICONS[doc.fileType]}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-800">{doc.name}</p>
              <p className="font-mono text-xs text-slate-500">
                {doc.id} · v{doc.version} · {formatSize(doc.sizeKb)} · uploaded{" "}
                {formatDate(doc.uploadedDate)} by {doc.uploadedBy}
              </p>
            </div>
            <ApprovalStatusBadge status={doc.approvalStatus} />
            <Button
              size="sm"
              variant="secondary"
              onClick={() => showToast(`Download started: ${doc.name}`, "success")}
            >
              Download
            </Button>
          </li>
        ))}
        {filtered.length === 0 ? (
          <li className="px-4 py-10 text-center text-sm text-slate-400">
            No documents with the selected approval status.
          </li>
        ) : null}
      </ul>
    </div>
  );
}
