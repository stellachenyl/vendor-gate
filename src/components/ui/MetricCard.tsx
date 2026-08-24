import { cn } from "@/lib/utils";

export interface MetricCardProps {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "positive" | "warning";
}

export function MetricCard({ label, value, hint, tone = "default" }: MetricCardProps) {
  return (
    <div className="card p-4" data-testid="metric-card">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p
        data-tone={tone}
        className={cn(
          "mt-1 font-mono text-3xl font-bold tracking-tight",
          tone === "warning" && "text-status-rejected",
          tone === "positive" && "text-status-approved",
          tone === "default" && "text-slate-900",
        )}
      >
        {value}
      </p>
      {hint ? <p className="mt-0.5 text-xs text-slate-400">{hint}</p> : null}
    </div>
  );
}
