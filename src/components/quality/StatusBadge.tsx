import type { ApprovalStatus, AuditStatus, Disposition, NcrStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

type Tone = "green" | "amber" | "red" | "indigo" | "slate" | "blue";

const toneClasses: Record<Tone, string> = {
  green: "bg-emerald-50 text-emerald-700 border-emerald-300",
  amber: "bg-amber-50 text-amber-700 border-amber-300",
  red: "bg-red-50 text-red-700 border-red-300",
  indigo: "bg-indigo-50 text-indigo-700 border-indigo-300",
  slate: "bg-slate-100 text-slate-600 border-slate-300",
  blue: "bg-blue-50 text-blue-700 border-blue-300",
};

function Badge({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-semibold",
        toneClasses[tone],
      )}
    >
      {children}
    </span>
  );
}

const ncrTones: Record<NcrStatus, Tone> = {
  Open: "red",
  Investigating: "amber",
  "Containment Done": "blue",
  "Root Cause Identified": "indigo",
  Verified: "green",
  Closed: "slate",
};

export function StatusBadge({ status }: { status: NcrStatus }) {
  return <Badge tone={ncrTones[status]}>{status}</Badge>;
}

const dispositionTones: Record<Disposition, Tone> = {
  Accepted: "green",
  Rejected: "red",
  "Use As Is": "amber",
  Rework: "blue",
  "Return to Supplier": "red",
};

export function DispositionBadge({ disposition }: { disposition: Disposition }) {
  return <Badge tone={dispositionTones[disposition]}>{disposition}</Badge>;
}

const approvalTones: Record<ApprovalStatus, Tone> = {
  Approved: "green",
  Pending: "indigo",
  Rejected: "red",
};

export function ApprovalStatusBadge({ status }: { status: ApprovalStatus }) {
  return <Badge tone={approvalTones[status]}>{status}</Badge>;
}

const auditTones: Record<AuditStatus, Tone> = {
  Scheduled: "blue",
  Completed: "green",
  Overdue: "red",
  "In Progress": "amber",
};

export function AuditStatusBadge({ status }: { status: AuditStatus }) {
  return <Badge tone={auditTones[status]}>{status}</Badge>;
}
