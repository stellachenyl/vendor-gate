import type { ActivityEntry } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export function ActivityTimeline({ entries }: { entries: ReadonlyArray<ActivityEntry> }) {
  if (entries.length === 0) {
    return <p className="text-sm text-slate-400">No activity recorded yet.</p>;
  }
  const ordered = [...entries].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <ol role="list" className="relative space-y-4 border-l-2 border-line pl-4">
      {ordered.map((entry, i) => (
        <li key={`${entry.date}-${i}`} className="relative">
          <span
            aria-hidden
            className={
              i === 0
                ? "absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-accent ring-2 ring-accent/30"
                : "absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-line"
            }
          />
          <p className="font-mono text-xs text-slate-400">{formatDate(entry.date)}</p>
          <p className="text-sm leading-relaxed text-slate-700">{entry.event}</p>
          <p className="text-xs font-medium text-slate-500">{entry.actor}</p>
        </li>
      ))}
    </ol>
  );
}
