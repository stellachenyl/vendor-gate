# Totalonics Quality — Supplier Quality Portal

An audit-ready supplier quality management portal built for Totalonics
Industrial Systems. It covers the full source-to-approved lifecycle: vendor
performance scorecards, AQL-based incoming inspections, 8D corrective actions,
document control, and an annual audit program.

## Feature list

- **Dashboard** — KPI cards (suppliers, pass rate, active NCRs, overdue
  corrective actions, upcoming audits), risk-tier distribution, top-5 worst
  performers, recent NCRs, audit preview.
- **Supplier management** — approved vendor list with filters and search,
  detail pages with five-axis weighted scorecards, inspection history, open
  NCRs, documents, and audit history.
- **NCR / 8D system** — filterable NCR register, three-step intake wizard with
  validation, and a detail view tracking D1–D8 with containment evidence,
  root cause, corrective action plan, sign-offs, and an activity timeline.
- **Document vault** — controlled document register with versioning,
  drag-and-drop upload (mock), preview modal, and QM-only approval workflow.
- **Audit management** — monthly calendar, full register with findings count,
  Schedule Audit modal, per-audit detail pages, and an annual Gantt plan.
- **Quality reports** — five report types with date/supplier filters, chart
  placeholders, data tables, mock PDF/CSV export buttons, and an auto-generated
  management summary.
- **Settings** — user directory, role permission matrix, ANSI/ASQ Z1.4 AQL
  sampling plans, severity/escalation rules, retention policy, notifications.
- **Supplier self-service portal** — scoped scorecard, response deadlines,
  upload area, own audits only, quality-team contacts.

## Tech stack

| Layer      | Choice                                        |
| ---------- | --------------------------------------------- |
| Framework  | Next.js 14 (App Router)                       |
| Language   | TypeScript (strict mode)                      |
| Styling    | Tailwind CSS                                  |
| Charts     | Hand-rolled SVG (radar, donut) — no deps      |
| Testing    | Jest + React Testing Library                  |
| Linting    | ESLint (`next/core-web-vitals`) + Prettier    |

## Setup

```bash
npm install
cp .env.example .env.local   # optional; mocks work without it
npm run dev                  # http://localhost:3000 → redirects to /dashboard
```

Other scripts: `npm run build`, `npm start`, `npm test`, `npm run test:coverage`,
`npm run lint`, `npm run typecheck`, `npm run format`.

## Role-based access control

Roles are switched from the avatar menu (demo auth). Scoping is centralized in
`src/lib/role-context.tsx`; every page derives visibility through `canView()`.

| Capability                | Quality Manager | Quality Engineer | Supplier User        |
| ------------------------- | --------------- | ---------------- | -------------------- |
| View all suppliers/data   | ✅              | ✅               | Own records only     |
| Raise NCR                 | ✅              | ✅               | ✅                   |
| Root cause edit           | ✅              | ❌               | ❌                   |
| Verification / closure    | ✅              | ❌               | ❌                   |
| Document Approve / Reject | ✅              | ❌               | ❌ (upload only)     |
| Schedule audits           | ✅              | ❌               | ❌ (view own)        |
| Portal settings           | ✅              | read-only        | ❌                   |

The demo Supplier User account is bound to `SUP-003` (Golden Circuit
Electronics); cross-tenant navigation falls back to a "not found" card.

## 8D methodology notes

Each NCR carries `eightDProgress`: exactly eight ordered steps (D1 Team … D8
Recognition) where completed steps are always a prefix — no skipping. The
stepper renders completed / current (first pending) / pending states and its
`aria-label` announces progress ("8D progress: step 4 of 8, root cause").
Closure requires verification first; both sign-offs record actor + date.
Escalation rules per severity live in `/settings`.

## Data model (mock layer in `src/lib/mock-data.ts`)

- **Supplier** — identity/code, category, risk tier, pass rate, open-NCR count,
  last audit, status, trend, contacts, KPI scores + weights, PPM, OTD.
- **InspectionRecord** — lot/part/PO, sample size vs. lot quantity, AQL level,
  pass/fail counts, disposition (Accept / Reject / Use As Is / Rework / RTS),
  inspector notes.
- **NonConformanceReport** — priority, status, assigned engineer, root cause
  category, containment + evidence, 8D team/steps, corrective actions with due
  dates, verification/closure sign-offs, activity log, cost impact.
- **VaultDocument** — type (Certificate/PPAP/Audit Report/SOP), owning
  supplier, version, upload metadata, approval status.
- **AuditEntry** — type, lead auditor, scope, checklist reference, team,
  findings count/summary, closure status.
- **DashboardStats** — derived via `computeDashboardStats(todayIso)` so KPI
  math stays deterministic and unit-testable.

All data is mock/in-memory; replace `src/lib/mock-data.ts` consumers with API
calls when wiring a backend.

## Deployment

```bash
npm run build && npm start   # standard Node server
```

Or deploy to Vercel: import the repo, set `NEXT_PUBLIC_SITE_URL`, deploy.
No database is required while the mock layer is active. Lighthouse targets:
accessibility > 90; all animations honor `prefers-reduced-motion`.
