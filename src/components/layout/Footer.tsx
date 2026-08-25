import { lastAuditDate, nextSurveillanceAudit } from "@/lib/mock-data";
import { formatDate } from "@/lib/utils";

export function Footer() {
  return (
    <footer className="mt-10 border-t border-line bg-card">
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:grid-cols-3">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Compliance Standards
          </h2>
          <ul className="mt-2 space-y-1 text-sm text-slate-600">
            <li>ISO 9001:2015 — Certified</li>
            <li>IATF 16949:2016 — Certified</li>
          </ul>
        </div>
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Audit Status
          </h2>
          <dl className="mt-2 space-y-1 text-sm text-slate-600">
            <div className="flex justify-between gap-4">
              <dt>Last audit:</dt>
              <dd className="font-mono">{formatDate(lastAuditDate)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>Next surveillance audit:</dt>
              <dd className="font-mono">{formatDate(nextSurveillanceAudit)}</dd>
            </div>
          </dl>
        </div>
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Contact
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Quality Department
            <br />
            <a
              href="mailto:quality@acme.com"
              className="font-medium text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
            >
              quality@acme.com
            </a>
          </p>
        </div>
      </div>
      <div className="border-t border-line py-3 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} acme Industrial Systems · Supplier Quality
        Portal v1.0
      </div>
    </footer>
  );
}
