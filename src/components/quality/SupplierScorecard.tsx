import type { KpiScores, Supplier } from "@/lib/types";

const SIZE = 220;
const CENTER = SIZE / 2;
const RADIUS = 80;
const LEVELS = 4;

const AXES: ReadonlyArray<{ key: keyof KpiScores; label: string }> = [
  { key: "quality", label: "Quality" },
  { key: "delivery", label: "Delivery" },
  { key: "responsiveness", label: "Resp." },
  { key: "documentation", label: "Docs" },
  { key: "pricing", label: "Pricing" },
];

function pointFor(index: number, value01: number): [number, number] {
  const angle = (Math.PI * 2 * index) / AXES.length - Math.PI / 2;
  return [
    CENTER + Math.cos(angle) * RADIUS * value01,
    CENTER + Math.sin(angle) * RADIUS * value01,
  ];
}

function polygonPoints(scores: KpiScores): string {
  return AXES.map((axis, i) => {
    const v = Math.max(0, Math.min(100, scores[axis.key])) / 100;
    const [x, y] = pointFor(i, v);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
}

function weightedScore(supplier: Supplier): number {
  const w = supplier.weights;
  const k = supplier.kpis;
  return (
    k.quality * w.quality +
    k.delivery * w.delivery +
    k.responsiveness * w.responsiveness +
    k.documentation * w.documentation +
    k.pricing * w.pricing
  );
}

export function SupplierScorecard({ supplier }: { supplier: Supplier }) {
  const score = weightedScore(supplier);
  const gridRings = Array.from({ length: LEVELS }, (_, i) => (i + 1) / LEVELS);

  return (
    <div className="rounded-lg border border-line bg-card p-5 shadow-card">
      <div className="mb-2 flex items-start justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">{supplier.name}</h3>
          <p className="font-mono text-xs text-slate-500">
            {supplier.id} · {supplier.category}
          </p>
        </div>
        <div className="text-right">
          <p className="font-mono text-2xl font-bold text-accent">{score.toFixed(1)}</p>
          <p className="text-xs text-slate-500">Weighted Score</p>
        </div>
      </div>

      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        role="img"
        aria-label={`KPI radar chart for ${supplier.name}: Quality ${supplier.kpis.quality}, Delivery ${supplier.kpis.delivery}, Responsiveness ${supplier.kpis.responsiveness}, Documentation ${supplier.kpis.documentation}, Pricing ${supplier.kpis.pricing}`}
        className="mx-auto h-56 w-56"
      >
        {/* Grid rings */}
        {gridRings.map((r) => (
          <polygon
            key={r}
            points={AXES.map((_, i) =>
              pointFor(i, r)
                .map((v) => v.toFixed(1))
                .join(","),
            ).join(" ")}
            fill="none"
            stroke="#E2E8F0"
            strokeWidth="1"
          />
        ))}
        {/* Axes */}
        {AXES.map((_, i) => {
          const [x, y] = pointFor(i, 1);
          return (
            <line
              key={i}
              x1={CENTER}
              y1={CENTER}
              x2={x}
              y2={y}
              stroke="#E2E8F0"
              strokeWidth="1"
            />
          );
        })}
        {/* Data polygon */}
        <polygon
          points={polygonPoints(supplier.kpis)}
          fill="#1D4ED8"
          fillOpacity="0.15"
          stroke="#1D4ED8"
          strokeWidth="2"
        />
        {/* Vertices */}
        {AXES.map((axis, i) => {
          const [x, y] = pointFor(i, supplier.kpis[axis.key] / 100);
          return <circle key={axis.key} cx={x} cy={y} r="3" fill="#1D4ED8" />;
        })}
        {/* Labels */}
        {AXES.map((axis, i) => {
          const [x, y] = pointFor(i, 1.22);
          return (
            <text
              key={axis.label}
              x={x}
              y={y}
              textAnchor={x < CENTER - 10 ? "end" : x > CENTER + 10 ? "start" : "middle"}
              dominantBaseline="middle"
              fontSize="11"
              fill="#64748B"
            >
              {axis.label} ({supplier.kpis[axis.key]})
            </text>
          );
        })}
      </svg>

      <dl className="mt-3 grid grid-cols-3 gap-2 border-t border-line pt-3 text-center">
        <div>
          <dt className="text-xs text-slate-500">On-Time</dt>
          <dd className="font-mono text-sm font-semibold text-slate-800">
            {supplier.onTimeDeliveryPct}%
          </dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">PPM Defects</dt>
          <dd className="font-mono text-sm font-semibold text-slate-800">
            {supplier.ppmDefects.toLocaleString()}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">Approved Since</dt>
          <dd className="font-mono text-sm font-semibold text-slate-800">
            {supplier.approvedSince.slice(0, 7)}
          </dd>
        </div>
      </dl>
    </div>
  );
}
