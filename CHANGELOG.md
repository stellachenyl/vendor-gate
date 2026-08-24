# Changelog

All notable changes to the Totalonics Supplier Quality Portal are documented
here. Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## v0.3.0 — 2026-08-15

### Added
- Audit management: monthly calendar, findings-count register, Schedule Audit
  modal, per-audit detail pages, annual Gantt-style audit plan.
- Quality reports: five report types with date/supplier filters, chart
  placeholders, data tables, mock PDF/CSV export, auto-generated management
  summary.
- Settings: user directory, role permission matrix, AQL sampling plan table,
  severity/escalation rules, document retention policy, notification toggles.
- Supplier self-service portal: scoped scorecard, NCR response deadlines,
  evidence upload area, own-audit visibility, quality-team contacts.
- Micro-interactions: sequential radar axis draw-in, staggered table row
  fade-in, 8D checkmark scale-in, overdue pulse, risk-tier bounce, toast
  slide-up, modal fade/scale — all honoring `prefers-reduced-motion`.
- Accessibility: screen-reader data table for the radar chart, descriptive 8D
  progress labels, modal focus capture + return-focus, inline form validation
  messages wired to `aria-describedby`/`role="alert"`.
- Performance: table virtualization above 100 rows, 300 ms debounced search,
  lazy-loaded secondary pages, memoized filtering/sorting, 20-row pagination.
- Loading skeletons, route error boundaries, and empty-state copy throughout.
- Production docs: README, this changelog, `.env.example`, Open Graph meta.

## v0.2.0 — 2026-08-08

### Added
- Dashboard with five KPI cards, risk-tier donut, worst-performer ranking,
  recent NCRs, and upcoming audits.
- Supplier management: filterable approved vendor list, Add Supplier modal,
  supplier detail pages with weighted scorecards and inspection history.
- NCR system: filterable register and detail pages tracking D1–D8.
- Document vault with approval workflow (Quality Manager only).
- Role-based views: Quality Manager sees all actions; Supplier User is scoped
  to their own records.

## v0.1.0 — 2026-08-01

### Added
- Next.js 14 App Router scaffold with TypeScript strict mode, Tailwind CSS,
  ESLint, and Prettier.
- Corporate design system (#F8FAFC canvas, #1D4ED8 accent), Inter +
  JetBrains Mono typography, status/risk color tokens.
- Global layout: top navigation with global search, New NCR action, role
  switcher; compliance footer (ISO 9001:2015 / IATF 16949:2016).
- Mock data layer: 15 suppliers, inspection lots, NCR fixtures, documents,
  audits, and deterministic dashboard statistics.
- PWA manifest, SEO metadata, keyboard-accessible components, skip link.
