"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AuditScheduler } from "@/components/quality/AuditScheduler";
import { AuditStatusBadge } from "@/components/quality/StatusBadge";
import { DataTable } from "@/components/data/DataTable";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input, Select } from "@/components/ui/FormControls";
import { useToast } from "@/components/ui/Toast";
import { EmptyState } from "@/components/ui/EmptyState";
import { addDays, audits, getSupplier, suppliers } from "@/lib/mock-data";
import { useRole } from "@/lib/role-context";
import type { AuditEntry } from "@/lib/types";
import { formatDate } from "@/lib/utils";

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
] as const;
const PLAN_YEAR = 2026;

export default function AuditsView() {
  const router = useRouter();
  const { canView, role } = useRole();
  const { showToast } = useToast();

  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [form, setForm] = useState({
    supplierId: "",
    type: "System Audit",
    date: "",
    auditor: "",
  });

  const visible = useMemo(
    () => audits.filter((a) => !a.supplierId || canView(a.supplierId)),
    [canView],
  );

  // Annual plan: confirmed audits + risk-tier-driven recurring plan entries.
  const planBars = useMemo(() => {
    type Bar = { id: string; label: string; startPct: number; widthPct: number; tone: string };
    const bars: Bar[] = [];
    for (const a of visible) {
      if (!a.date.startsWith(String(PLAN_YEAR))) continue;
      const month = Number(a.date.slice(5, 7)) - 1;
      bars.push({
        id: a.id,
        label: `${getSupplier(a.supplierId ?? "")?.code ?? "Internal"} · ${a.type}`,
        startPct: (month / 12) * 100,
        widthPct: 8,
        tone:
          a.status === "Completed"
            ? "bg-status-approved"
            : a.status === "Overdue"
              ? "bg-status-rejected"
              : "bg-accent",
      });
    }
    // Planned cadence per remaining risk-tier suppliers (Gantt placeholders).
    const cadenceMonths: Record<string, number[]> = {
      Critical: [0, 3, 6, 9],
      High: [1, 7],
      Medium: [4],
      Low: [10],
    };
    for (const s of suppliers) {
      if (!canView(s.id) || s.status !== "Active") continue;
      for (const m of cadenceMonths[s.riskTier] ?? []) {
        if (bars.some((b) => b.id.includes(s.code) && Math.abs(b.startPct - (m / 12) * 100) < 1)) continue;
        bars.push({
          id: `plan-${s.id}-${m}`,
          label: `${s.code} · planned ${s.riskTier} audit`,
          startPct: (m / 12) * 100,
          widthPct: 8,
          tone: "bg-slate-300",
        });
      }
    }
    return bars.sort((a, b) => a.startPct - b.startPct);
  }, [visible, canView]);

  const columns = useMemo(
    () => [
      {
        key: "id",
        header: "Audit ID",
        render: (row: AuditEntry) => (
          <button
            type="button"
            className="font-mono font-semibold text-accent hover:underline"
            onClick={() => router.push(`/audits/${row.id}`)}
          >
            {row.id}
          </button>
        ),
      },
      {
        key: "supplier",
        header: "Supplier",
        value: (row: AuditEntry) =>
          row.supplierId ? (getSupplier(row.supplierId)?.name ?? row.supplierId) : "Internal",
        render: (row: AuditEntry) => (
          <span>
            {row.supplierId ? (getSupplier(row.supplierId)?.name ?? row.supplierId) : "Internal"}
          </span>
        ),
      },
      { key: "type" as const, header: "Type" },
      { key: "auditor" as const, header: "Lead Auditor" },
      {
        key: "date" as const,
        header: "Date",
        value: (row: AuditEntry) => row.date,
        render: (row: AuditEntry) => <span className="font-mono text-xs">{formatDate(row.date)}</span>,
      },
      {
        key: "status" as const,
        header: "Status",
        value: (row: AuditEntry) => row.status,
        render: (row: AuditEntry) => <AuditStatusBadge status={row.status} />,
      },
      {
        key: "findingsCount" as const,
        header: "Findings",
        align: "right" as const,
        value: (row: AuditEntry) => row.findingsCount ?? 0,
        render: (row: AuditEntry) =>
          (row.findingsCount ?? 0) > 0 ? (
            <span className="font-mono font-semibold text-orange-600">{row.findingsCount}</span>
          ) : (
            <span className="font-mono text-slate-400">—</span>
          ),
      },
    ],
    [router],
  );

  return (
    <>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="page-title">Audit Management</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            {role} view · Internal system and process audits plus third-party surveillance under
            IATF 16949 §9.2.
          </p>
        </div>
        {role === "Quality Manager" ? (
          <Button onClick={() => setScheduleOpen(true)}>+ Schedule Audit</Button>
        ) : null}
      </div>

      <section aria-label="Annual audit plan" className="card mb-5 p-5">
        <h2 className="mb-1 text-sm font-semibold text-slate-800">
          Annual Audit Plan — {PLAN_YEAR}
        </h2>
        <p className="mb-3 text-xs text-slate-500">
          Cadence follows risk tier: Critical quarterly · High semiannual · Medium/Low annual.
          Grey bars are planned; coloured bars are scheduled or complete.
        </p>
        <div
          role="img"
          aria-label={`Gantt timeline of ${planBars.length} audits planned across ${PLAN_YEAR}`}
          className="space-y-1.5"
        >
          <div className="flex justify-between px-[4%] font-mono text-[10px] text-slate-400">
            {MONTH_LABELS.map((m) => (
              <span key={m}>{m}</span>
            ))}
          </div>
          {planBars.map((bar) => (
            <div key={bar.id} className="relative h-5 rounded bg-line/50">
              <div
                className={`absolute top-0.5 h-4 rounded ${bar.tone}`}
                style={{ left: `${bar.startPct}%`, width: `${bar.widthPct}%` }}
                title={bar.label}
              />
              <span className="absolute inset-y-0 left-2 flex items-center truncate pr-2 font-mono text-[10px] text-slate-500">
                {bar.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      <AuditScheduler audits={visible} />

      <section aria-label="Full audit history" className="mt-6">
        {visible.length === 0 ? (
          <EmptyState
            title="No audits planned. Schedule one to maintain compliance."
            hint="Use the Schedule Audit button to add the first entry."
          />
        ) : (
          <DataTable
            columns={columns}
            data={[...visible].sort((a, b) => b.date.localeCompare(a.date))}
            rowKey={(a) => a.id}
            csvFilename="audit-program.csv"
            caption="Complete Audit Register"
          />
        )}
      </section>

      {/* Schedule Audit modal */}
      <Modal
        open={scheduleOpen}
        onClose={() => setScheduleOpen(false)}
        title="Schedule Audit"
        description="The lead auditor and supplier contact receive calendar invites."
        footer={
          <>
            <Button variant="secondary" onClick={() => setScheduleOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={
                form.supplierId === "" || form.date === "" || form.auditor.trim() === ""
              }
              onClick={() => {
                setScheduleOpen(false);
                showToast("Audit scheduled and invites sent.", "success");
                setForm({ supplierId: "", type: form.type, date: "", auditor: "" });
              }}
            >
              Schedule
            </Button>
          </>
        }
      >
        <form className="space-y-3" onSubmit={(e) => e.preventDefault()}>
          <Select
            label="Supplier"
            required
            value={form.supplierId}
            onChange={(e) => setForm({ ...form, supplierId: e.target.value })}
            options={[
              { value: "", label: "Select supplier…" },
              ...suppliers.map((s) => ({ value: s.id, label: `${s.name} (${s.code})` })),
            ]}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Select
              label="Audit Type"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              options={[
                { value: "System Audit", label: "System Audit" },
                { value: "Process Audit", label: "Process Audit" },
                { value: "Product Audit", label: "Product Audit" },
              ]}
            />
            <Input
              label="Date"
              required
              type="date"
              min={addDays(new Date().toISOString().slice(0, 10), 1)}
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
          </div>
          <Input
            label="Lead Auditor"
            required
            placeholder="e.g. R. Okafor"
            value={form.auditor}
            onChange={(e) => setForm({ ...form, auditor: e.target.value })}
          />
        </form>
      </Modal>
    </>
  );
}
