import type { InspectionRecord } from "@/lib/types";
import { getSupplier } from "@/lib/mock-data";
import { formatDate } from "@/lib/utils";
import { DispositionBadge } from "./StatusBadge";

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="font-mono text-sm font-semibold text-slate-800">{value}</dd>
    </div>
  );
}

export function InspectionRecord({ record }: { record: InspectionRecord }) {
  const supplier = getSupplier(record.supplierId);
  const passRate = ((record.passCount / Math.max(record.sampleSize, 1)) * 100).toFixed(1);
  const failed =
    record.disposition === "Rejected" || record.disposition === "Return to Supplier";

  return (
    <article
      className={`rounded-lg border bg-card p-5 shadow-card ${
        failed ? "border-l-4 border-status-rejected/40" : "border-line"
      }`}
      aria-label={`Inspection record ${record.id}`}
    >
      <header className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-mono text-sm font-bold text-slate-900">
              {record.lotNumber}
            </h3>
            <DispositionBadge disposition={record.disposition} />
          </div>
          <p className="mt-0.5 text-sm font-medium text-slate-700">{record.partName}</p>
          <p className="font-mono text-xs text-slate-500">
            P/N {record.partNumber} · PO {record.poNumber} ·{" "}
            {supplier?.name ?? record.supplierId}
          </p>
        </div>
        <p className="text-right text-xs text-slate-500">
          Received
          <br />
          <span className="font-mono text-sm font-medium text-slate-800">
            {formatDate(record.receivedDate)}
          </span>
        </p>
      </header>

      <dl className="grid grid-cols-3 gap-x-4 gap-y-3 sm:grid-cols-6">
        <Metric label="Sample Size (n)" value={record.sampleSize} />
        <Metric label="Lot Qty" value={record.lotQuantity.toLocaleString()} />
        <Metric label="Pass" value={record.passCount} />
        <Metric label="Fail" value={record.failCount} />
        <Metric label="Pass Rate %" value={passRate} />
        <Metric label="AQL Level" value={record.aqlLevel} />
      </dl>

      <footer className="mt-4 border-t border-line pt-3">
        <p className="text-xs leading-relaxed text-slate-600">
          <span className="font-medium text-slate-700">Inspector notes — </span>
          {record.inspectorNotes}
        </p>
        <p className="mt-1.5 font-mono text-xs text-slate-400">
          Inspected by {record.inspectedBy} · {record.id}
        </p>
      </footer>
    </article>
  );
}
