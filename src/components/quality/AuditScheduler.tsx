"use client";

import { useMemo, useState } from "react";
import type { AuditEntry } from "@/lib/types";
import { AuditStatusBadge } from "./StatusBadge";
import { cn, formatDate } from "@/lib/utils";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

/** Builds a Monday-first 6x7 month grid for the given ISO year-month. */
function buildMonthGrid(year: number, month: number): Array<Date | null> {
  const first = new Date(Date.UTC(year, month, 1));
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const startOffset = (first.getUTCDay() + 6) % 7; // Monday-first
  const cells: Array<Date | null> = Array.from({ length: startOffset }, () => null);
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(new Date(Date.UTC(year, month, day)));
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

const ISO = (d: Date) => d.toISOString().slice(0, 10);

export function AuditScheduler({ audits }: { audits: ReadonlyArray<AuditEntry> }) {
  const today = new Date();
  const [cursor, setCursor] = useState({
    year: today.getUTCFullYear(),
    month: today.getUTCMonth(),
  });
  const [selectedDate, setSelectedDate] = useState<string>(ISO(today));

  const byDate = useMemo(() => {
    const map = new Map<string, AuditEntry[]>();
    for (const a of audits) {
      const list = map.get(a.date) ?? [];
      list.push(a);
      map.set(a.date, list);
    }
    return map;
  }, [audits]);

  const grid = buildMonthGrid(cursor.year, cursor.month);
  const monthLabel = new Date(Date.UTC(cursor.year, cursor.month, 1)).toLocaleDateString(
    "en-US",
    { month: "long", year: "numeric", timeZone: "UTC" },
  );

  const shiftMonth = (delta: number) =>
    setCursor((c) => {
      const m = c.month + delta;
      return { year: c.year + Math.floor(m / 12), month: ((m % 12) + 12) % 12 };
    });

  const selectedAudits = byDate.get(selectedDate) ?? [];

  return (
    <div className="rounded-lg border border-line bg-card shadow-card">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <h3 className="text-sm font-semibold text-slate-800">Audit Schedule</h3>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => shiftMonth(-1)}
            aria-label="Previous month"
            className="h-8 w-8 rounded-md border border-line text-slate-600 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
          >
            ‹
          </button>
          <p className="min-w-[140px] text-center text-sm font-semibold text-slate-800">
            {monthLabel}
          </p>
          <button
            type="button"
            onClick={() => shiftMonth(1)}
            aria-label="Next month"
            className="h-8 w-8 rounded-md border border-line text-slate-600 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
          >
            ›
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[auto_280px]">
        {/* Calendar grid */}
        <div className="p-4">
          <div className="grid grid-cols-7 gap-1" role="grid" aria-label={monthLabel}>
            {WEEKDAYS.map((d) => (
              <div
                key={d}
                className="pb-1 text-center text-xs font-medium text-slate-400"
              >
                {d}
              </div>
            ))}
            {grid.map((date, i) => {
              if (!date) return <div key={`empty-${i}`} />;
              const iso = ISO(date);
              const dayAudits = byDate.get(iso) ?? [];
              const isSelected = iso === selectedDate;
              const isToday = iso === ISO(today);
              return (
                <button
                  key={iso}
                  type="button"
                  onClick={() => setSelectedDate(iso)}
                  aria-label={`${formatDate(iso)}${dayAudits.length ? `, ${dayAudits.length} audit(s)` : ""}`}
                  aria-pressed={isSelected}
                  className={cn(
                    "relative flex h-16 flex-col items-start rounded-md border p-1.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50",
                    isSelected
                      ? "border-accent bg-accent-soft"
                      : "border-transparent hover:bg-slate-50",
                  )}
                >
                  <span
                    className={cn(
                      "font-mono text-xs",
                      isToday ? "font-bold text-accent" : "text-slate-600",
                      dayAudits.length > 0 && "font-semibold",
                    )}
                  >
                    {date.getUTCDate()}
                  </span>
                  {dayAudits.slice(0, 2).map((a) => (
                    <span
                      key={a.id}
                      className="mt-0.5 block w-full truncate rounded bg-accent px-1 py-0.5 text-[9px] font-medium text-white"
                    >
                      {a.type}
                    </span>
                  ))}
                  {dayAudits.length > 2 ? (
                    <span className="text-[9px] text-slate-500">
                      +{dayAudits.length - 2} more
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected-day detail */}
        <aside
          className="border-t border-line p-4 lg:border-l lg:border-t-0"
          aria-live="polite"
        >
          <h4 className="mb-3 font-mono text-xs font-semibold uppercase tracking-wide text-slate-500">
            {formatDate(selectedDate)}
          </h4>
          {selectedAudits.length === 0 ? (
            <p className="text-sm text-slate-400">No audits scheduled on this date.</p>
          ) : (
            <ul role="list" className="space-y-3">
              {selectedAudits.map((a) => (
                <li key={a.id} className="rounded-md border border-line p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-slate-800">
                      {a.id}
                    </span>
                    <AuditStatusBadge status={a.status} />
                  </div>
                  <p className="mt-1 text-sm font-medium text-slate-700">{a.type}</p>
                  <p className="text-xs text-slate-500">Auditor: {a.auditor}</p>
                  <p className="text-xs text-slate-500">{a.location}</p>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </div>
  );
}
