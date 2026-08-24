import type { RiskTier } from "@/lib/types";

const TIER_COLORS: Record<RiskTier, string> = {
  Low: "#10B981",
  Medium: "#F59E0B",
  High: "#F97316",
  Critical: "#DC2626",
};
const TIERS: RiskTier[] = ["Low", "Medium", "High", "Critical"];

export interface RiskDonutProps {
  suppliers: ReadonlyArray<{ riskTier: RiskTier }>;
}

/** Donut chart of supplier risk-tier distribution with a count legend. */
export function RiskDonut({ suppliers }: RiskDonutProps) {
  const counts = TIERS.map((tier) => ({
    tier,
    count: suppliers.filter((s) => s.riskTier === tier).length,
  })).filter((c) => c.count > 0);

  const total = counts.reduce((a, c) => a + c.count, 0);
  const R = 56;
  const CIRC = 2 * Math.PI * R;
  let offset = 0;

  if (total === 0) {
    return (
      <div className="card p-8 text-center text-sm text-slate-400">
        No suppliers to display.
      </div>
    );
  }

  return (
    <div className="card flex items-center gap-6 p-5">
      <svg
        viewBox="0 0 160 160"
        className="-rotate-90 h-40 w-40 shrink-0"
        role="img"
        aria-label={`Risk tier distribution of ${total} suppliers`}
      >
        <circle cx="80" cy="80" r={R} fill="none" stroke="#E2E8F0" strokeWidth="22" />
        {counts.map(({ tier, count }) => {
          const len = (count / total) * CIRC;
          const dash = `${len} ${CIRC - len}`;
          const el = (
            <circle
              key={tier}
              cx="80"
              cy="80"
              r={R}
              fill="none"
              stroke={TIER_COLORS[tier]}
              strokeWidth="22"
              strokeDasharray={dash}
              strokeDashoffset={-offset}
            />
          );
          offset += len;
          return el;
        })}
      </svg>
      <ul className="space-y-2">
        {TIERS.map((tier) => (
          <li key={tier} className="flex items-center gap-2 text-sm">
            <span aria-hidden className="h-3 w-3 rounded-sm" style={{ background: TIER_COLORS[tier] }} />
            <span className="w-16 font-medium text-slate-700">{tier}</span>
            <span className="font-mono text-slate-500">
              {suppliers.filter((s) => s.riskTier === tier).length}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
