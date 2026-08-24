"use client";

import { useId, useState } from "react";
import { cn } from "@/lib/utils";

export interface TabItem {
  id: string;
  label: string;
  content: React.ReactNode;
}

export function Tabs({ items, className }: { items: TabItem[]; className?: string }) {
  const [activeId, setActiveId] = useState(items[0]?.id ?? "");
  const baseId = useId();

  return (
    <div className={className}>
      <div
        role="tablist"
        aria-label="Sections"
        className="flex gap-1 border-b border-line"
      >
        {items.map((item) => {
          const selected = item.id === activeId;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              id={`${baseId}-tab-${item.id}`}
              aria-selected={selected}
              aria-controls={`${baseId}-panel-${item.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActiveId(item.id)}
              onKeyDown={(e) => {
                const idx = items.findIndex((i) => i.id === activeId);
                if (e.key === "ArrowRight") {
                  setActiveId(items[(idx + 1) % items.length]?.id ?? activeId);
                } else if (e.key === "ArrowLeft") {
                  setActiveId(
                    items[(idx - 1 + items.length) % items.length]?.id ?? activeId,
                  );
                }
              }}
              className={cn(
                "-mb-px rounded-t-md border-b-2 px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50",
                selected
                  ? "border-accent text-accent"
                  : "border-transparent text-slate-500 hover:text-slate-800",
              )}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      {items.map((item) => (
        <div
          key={item.id}
          role="tabpanel"
          id={`${baseId}-panel-${item.id}`}
          aria-labelledby={`${baseId}-tab-${item.id}`}
          hidden={item.id !== activeId}
          className="pt-4"
        >
          {item.id === activeId ? item.content : null}
        </div>
      ))}
    </div>
  );
}
