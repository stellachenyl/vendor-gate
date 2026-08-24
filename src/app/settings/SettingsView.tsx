"use client";

import { useState } from "react";
import { DataTable } from "@/components/data/DataTable";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/FormControls";
import { useToast } from "@/components/ui/Toast";
import { aqlSamplingPlans, portalUsers, retentionPolicies, severityPolicies } from "@/lib/mock-data";
import { useRole } from "@/lib/role-context";

const PERMISSIONS = [
  { area: "Supplier master data", qm: "Edit", engineer: "View", supplier: "Own only" },
  { area: "Incoming inspections", qm: "Edit", engineer: "Edit", supplier: "Own only" },
  { area: "NCR raise / respond", qm: "Edit", engineer: "Edit", supplier: "Respond" },
  { area: "8D sign-off & closure", qm: "Edit", engineer: "View", supplier: "—" },
  { area: "Document approval", qm: "Edit", engineer: "View", supplier: "Upload" },
  { area: "Audit program", qm: "Edit", engineer: "View", supplier: "Own audits" },
  { area: "Portal settings", qm: "Edit", engineer: "—", supplier: "—" },
];

export default function SettingsView() {
  const { role } = useRole();
  const { showToast } = useToast();
  const isManager = role === "Quality Manager";

  const [aqlLevel, setAqlLevel] = useState("1.0");
  const [inspectionLevel, setInspectionLevel] = useState("General II");
  const [switchingRules, setSwitchingRules] = useState(true);
  const [retentionYears, setRetentionYears] = useState<Record<string, number>>(
    Object.fromEntries(retentionPolicies.map((r) => [r.docType, r.years])),
  );
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifyDigest, setNotifyDigest] = useState(true);
  const [notifyOverdue, setNotifyOverdue] = useState(true);

  return (
    <>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="page-title">Portal Configuration</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            {role} view · Changes are audit-trailed with user and timestamp.
            {!isManager ? " Read-only for your role." : ""}
          </p>
        </div>
        {isManager ? (
          <Button onClick={() => showToast("Settings saved with audit trail entry.", "success")}>
            Save Changes
          </Button>
        ) : null}
      </div>

      {/* User management */}
      <section aria-label="User management" className="card mb-5 p-5">
        <h2 className="mb-3 text-sm font-semibold text-slate-800">
          Users <span className="font-mono font-normal text-slate-400">({portalUsers.length})</span>
        </h2>
        <DataTable
          columns={[
            { key: "name", header: "Name" },
            { key: "email", header: "Email" },
            {
              key: "role",
              header: "Role",
              render: (row: (typeof portalUsers)[number]) => (
                <span className="rounded border border-line bg-slate-50 px-1.5 py-0.5 text-xs font-medium text-slate-600">
                  {row.role}
                </span>
              ),
            },
            {
              key: "status",
              header: "Status",
              value: (row: (typeof portalUsers)[number]) => row.status,
              render: (row: (typeof portalUsers)[number]) =>
                row.status === "Active" ? (
                  <span className="rounded-full border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                    Active
                  </span>
                ) : (
                  <span className="rounded-full border border-red-300 bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700">
                    Suspended
                  </span>
                ),
            },
            {
              key: "lastActive",
              header: "Last Active",
              render: (row: (typeof portalUsers)[number]) => (
                <span className="font-mono text-xs">{row.lastActive}</span>
              ),
            },
          ]}
          data={portalUsers}
          rowKey={(u) => u.id}
          csvFilename="portal-users.csv"
        />
      </section>

      {/* Role permission matrix */}
      <section aria-label="Role permissions matrix" className="card mb-5 overflow-x-auto p-5">
        <h2 className="mb-3 text-sm font-semibold text-slate-800">Role Permissions Matrix</h2>
        <table className="w-full min-w-[520px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-slate-500">
              <th scope="col" className="pb-2">Portal area</th>
              <th scope="col" className="pb-2">Quality Manager</th>
              <th scope="col" className="pb-2">Quality Engineer</th>
              <th scope="col" className="pb-2">Supplier User</th>
            </tr>
          </thead>
          <tbody>
            {PERMISSIONS.map((p) => (
              <tr key={p.area} className="border-b border-line last:border-b-0">
                <th scope="row" className="py-2 pr-3 text-left font-medium text-slate-700">
                  {p.area}
                </th>
                {[p.qm, p.engineer, p.supplier].map((perm) => (
                  <td
                    key={perm + p.area}
                    className={
                      perm === "Edit"
                        ? "py-2 font-semibold text-emerald-700"
                        : perm === "—"
                          ? "py-2 text-slate-300"
                          : "py-2 text-slate-600"
                    }
                  >
                    {perm}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* AQL settings */}
        <section aria-label="Inspection AQL settings" className="card p-5">
          <h2 className="mb-3 text-sm font-semibold text-slate-800">
            Inspection AQL Settings{" "}
            <span className="font-normal text-slate-400">(ANSI/ASQ Z1.4)</span>
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <Select
              label="Default AQL level"
              disabled={!isManager}
              value={aqlLevel}
              onChange={(e) => setAqlLevel(e.target.value)}
              options={["0.65", "1.0", "1.5", "2.5", "4.0"].map((v) => ({ value: v, label: v }))}
            />
            <Select
              label="Inspection level"
              disabled={!isManager}
              value={inspectionLevel}
              onChange={(e) => setInspectionLevel(e.target.value)}
              options={[
                { value: "General I", label: "General I (reduced)" },
                { value: "General II", label: "General II (normal)" },
                { value: "General III", label: "General III (tightened)" },
              ]}
            />
            <Select
              label="Switching rules"
              disabled={!isManager}
              value={switchingRules ? "on" : "off"}
              onChange={(e) => setSwitchingRules(e.target.value === "on")}
              options={[
                { value: "on", label: "Enabled (normal ↔ tightened)" },
                { value: "off", label: "Disabled" },
              ]}
            />
          </div>
          <table className="mt-4 w-full text-xs">
            <caption className="sr-only">Sampling plans by lot size band</caption>
            <thead>
              <tr className="border-b border-line text-left uppercase tracking-wide text-slate-500">
                <th scope="col" className="pb-1">Lot size</th>
                <th scope="col" className="pb-1">Sample</th>
                <th scope="col" className="pb-1">Ac</th>
                <th scope="col" className="pb-1">Re</th>
              </tr>
            </thead>
            <tbody className="font-mono">
              {aqlSamplingPlans.map((p) => (
                <tr key={p.lotBand} className="border-b border-line last:border-b-0">
                  <th scope="row" className="py-1 text-left font-normal text-slate-600">{p.lotBand}</th>
                  <td>{p.sampleSize}</td>
                  <td>{p.accept}</td>
                  <td>{p.reject}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <div className="space-y-5">
          {/* Severity definitions */}
          <section aria-label="NCR severity definitions and escalation rules" className="card p-5">
            <h2 className="mb-3 text-sm font-semibold text-slate-800">
              NCR Severity &amp; Escalation Rules
            </h2>
            <ul role="list" className="space-y-3">
              {severityPolicies.map((policy) => (
                <li key={policy.priority} className="rounded-md border border-line p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold text-slate-800">{policy.priority}</span>
                    <span className="font-mono text-xs text-slate-500">
                      Contain ≤ {policy.containmentDays}d · Close ≤ {policy.closureDays}d
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600">
                    {policy.definition}
                  </p>
                  <label className="mt-2 block text-xs text-slate-500">
                    Escalate to{" "}
                    <input
                      defaultValue={policy.escalateTo}
                      disabled={!isManager}
                      aria-label={`Escalation target for ${policy.priority}`}
                      className="ml-1 w-56 rounded border border-line px-1.5 py-0.5 text-xs disabled:bg-slate-50"
                    />
                  </label>
                </li>
              ))}
            </ul>
          </section>

          {/* Retention + notifications */}
          <section aria-label="Document retention policy" className="card p-5">
            <h2 className="mb-3 text-sm font-semibold text-slate-800">Document Retention</h2>
            <ul role="list" className="space-y-2">
              {retentionPolicies.map((r) => (
                <li key={r.docType} className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-slate-700">{r.docType}</span>
                  <span>
                    <input
                      type="number"
                      min={1}
                      max={30}
                      disabled={!isManager}
                      aria-label={`${r.docType} retention years`}
                      value={retentionYears[r.docType]}
                      onChange={(e) =>
                        setRetentionYears({ ...retentionYears, [r.docType]: Number(e.target.value) })
                      }
                      className="w-16 rounded border border-line px-1.5 py-0.5 font-mono text-xs disabled:bg-slate-50"
                    />
                    <span className="ml-1 text-xs text-slate-500">years</span>
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section aria-label="Notification preferences" className="card p-5">
            <h2 className="mb-3 text-sm font-semibold text-slate-800">Notification Preferences</h2>
            {[
              { label: "Email on new NCR assigned to my supplier", checked: notifyEmail, set: setNotifyEmail },
              { label: "Weekly quality digest (Monday 07:00)", checked: notifyDigest, set: setNotifyDigest },
              { label: "Escalation alerts for overdue corrective actions", checked: notifyOverdue, set: setNotifyOverdue },
            ].map((pref) => (
              <label key={pref.label} className="flex items-center justify-between gap-3 py-1.5 text-sm text-slate-700">
                {pref.label}
                <input
                  type="checkbox"
                  checked={pref.checked}
                  disabled={!isManager}
                  onChange={(e) => pref.set(e.target.checked)}
                  className="h-4 w-4 accent-[#1D4ED8]"
                />
              </label>
            ))}
          </section>
        </div>
      </div>
    </>
  );
}
