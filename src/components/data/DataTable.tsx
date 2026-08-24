"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { cn, exportToCsv, prefersReducedMotion, staggerDelay } from "@/lib/utils";

export interface Column<T> {
  key: string;
  header: string;
  /** Renders the cell; defaults to String(row[key]). */
  render?: (row: T) => React.ReactNode;
  value?: (row: T) => string | number;
  sortable?: boolean;
  align?: "left" | "right";
}

interface DataTableProps<T> {
  columns: ReadonlyArray<Column<T>>;
  /** Full dataset. The table simulates server-side paging by slicing per page. */
  data: ReadonlyArray<T>;
  rowKey: (row: T) => string;
  pageSize?: number;
  csvFilename: string;
  caption?: string;
  /** Makes rows clickable/keyboard-activatable (e.g. navigate to detail). */
  onRowClick?: (row: T) => void;
}

type SortState = { key: string; direction: "asc" | "desc" } | null;

/** Rows per page when the caller does not pin a size. */
export const DEFAULT_PAGE_SIZE = 20;

/**
 * Windowing kicks in well above the pagination page size so normal tables
 * never pay for it; large ad-hoc pages (>100 rows) stay DOM-light.
 */
const VIRTUAL_THRESHOLD = 60;
const VIRTUAL_ROW_HEIGHT = 44;
const VIRTUAL_VIEWPORT = 440;
const VIRTUAL_OVERSCAN = 6;

export function DataTable<T>({
  columns,
  data,
  rowKey,
  pageSize = DEFAULT_PAGE_SIZE,
  csvFilename,
  caption,
  onRowClick,
}: DataTableProps<T>) {
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<SortState>(null);
  const reducedMotion = useMemo(() => prefersReducedMotion(), []);

  // Row stagger replays whenever the dataset identity changes (filter/sort),
  // implemented by re-keying rows with an epoch counter.
  const [staggerEpoch, setStaggerEpoch] = useState(0);
  const dataSignature = data.map((d) => rowKey(d)).join("|");
  useEffect(() => {
    setStaggerEpoch((e) => e + 1);
  }, [dataSignature]);

  const sorted = useMemo(() => {
    if (!sort) return data;
    const col = columns.find((c) => c.key === sort.key);
    // Keep the raw value so numeric fields compare numerically instead of
    // lexicographically; only stringify when the column carries no value.
    const getVal = (row: T): string | number => {
      const raw =
        col && col.value
          ? col.value(row)
          : (row[sort.key as keyof T] as string | number | undefined);
      return raw ?? "";
    };
    return [...data].sort((a, b) => {
      const va = getVal(a);
      const vb = getVal(b);
      const cmp =
        typeof va === "number" && typeof vb === "number"
          ? va - vb
          : String(va).localeCompare(String(vb), undefined, { numeric: true });
      return sort.direction === "asc" ? cmp : -cmp;
    });
  }, [data, sort, columns]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const pageRows = sorted.slice((safePage - 1) * pageSize, safePage * pageSize);

  // --- Virtual scrolling for oversized pages -------------------------------
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const virtualizing = pageRows.length > VIRTUAL_THRESHOLD;

  useEffect(() => {
    setScrollTop(0);
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [safePage, dataSignature, sort]);

  let visibleRows = pageRows;
  let padTop = 0;
  let padBottom = 0;
  if (virtualizing) {
    const start = Math.max(
      0,
      Math.floor(scrollTop / VIRTUAL_ROW_HEIGHT) - VIRTUAL_OVERSCAN,
    );
    const end = Math.min(
      pageRows.length,
      Math.ceil((scrollTop + VIRTUAL_VIEWPORT) / VIRTUAL_ROW_HEIGHT) +
        VIRTUAL_OVERSCAN,
    );
    visibleRows = pageRows.slice(start, end);
    padTop = start * VIRTUAL_ROW_HEIGHT;
    padBottom = (pageRows.length - end) * VIRTUAL_ROW_HEIGHT;
  }

  const handleSort = (key: string) => {
    setPage(1);
    setSort((prev) =>
      prev?.key === key
        ? prev.direction === "asc"
          ? { key, direction: "desc" }
          : null
        : { key, direction: "asc" },
    );
  };

  const handleExport = () => {
    const headers = columns.map((c) => c.header);
    const rows = sorted.map((row) =>
      columns.map(
        (c) =>
          (c.value ? c.value(row) : String(row[c.key as keyof T] ?? "")) as
            string | number,
      ),
    );
    exportToCsv(csvFilename, headers, rows);
  };

  return (
    <div className="rounded-lg border border-line bg-card shadow-card">
      <div className="flex items-center justify-between gap-2 px-4 py-3">
        {caption ? (
          <h3 className="text-sm font-semibold text-slate-800">{caption}</h3>
        ) : (
          <span />
        )}
        <Button size="sm" variant="secondary" onClick={handleExport}>
          Export CSV
        </Button>
      </div>
      <div
        ref={scrollRef}
        className={cn(
          "overflow-x-auto",
          virtualizing && "overflow-y-auto",
        )}
        style={virtualizing ? { maxHeight: VIRTUAL_VIEWPORT } : undefined}
        onScroll={
          virtualizing
            ? (e) => setScrollTop(e.currentTarget.scrollTop)
            : undefined
        }
      >
        <table className="w-full text-sm">
          <thead className={cn(virtualizing && "sticky top-0 bg-slate-50 z-10")}>
            <tr className="border-y border-line bg-slate-50/70">
              {columns.map((col) => {
                const isSorted = sort?.key === col.key;
                return (
                  <th
                    key={col.key}
                    scope="col"
                    aria-sort={
                      isSorted
                        ? sort!.direction === "asc"
                          ? "ascending"
                          : "descending"
                        : undefined
                    }
                    className={cn(
                      "px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500",
                      col.align === "right" ? "text-right" : "text-left",
                    )}
                  >
                    {col.sortable === false ? (
                      col.header
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSort(col.key)}
                        className={cn(
                          "inline-flex items-center gap-1 rounded hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50",
                        )}
                      >
                        {col.header}
                        <span
                          aria-hidden
                          className={cn("text-[10px]", !isSorted && "opacity-30")}
                        >
                          {isSorted && sort!.direction === "desc" ? "\u25BC" : "\u25B2"}
                        </span>
                      </button>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {padTop > 0 ? (
              <tr aria-hidden style={{ height: padTop }}>
                <td colSpan={columns.length} />
              </tr>
            ) : null}
            {visibleRows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-10 text-center text-sm text-slate-400"
                >
                  No records match the current filters.
                </td>
              </tr>
            ) : (
              visibleRows.map((row, rowIndex) => (
                <tr
                  key={`${staggerEpoch}:${rowKey(row)}`}
                  style={
                    reducedMotion
                      ? undefined
                      : { animationDelay: staggerDelay(rowIndex, 30) }
                  }
                  className={cn(
                    "animate-fade-in-row border-b border-line last:border-b-0",
                    onRowClick
                      ? "cursor-pointer hover:bg-accent-soft/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent"
                      : "hover:bg-accent-soft/40",
                  )}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  tabIndex={onRowClick ? 0 : undefined}
                  onKeyDown={
                    onRowClick
                      ? (e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            onRowClick(row);
                          }
                        }
                      : undefined
                  }
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn(
                        "px-4 py-2.5 align-middle",
                        col.align === "right" ? "text-right tabular-nums" : "text-left",
                      )}
                    >
                      {col.render
                        ? col.render(row)
                        : String(row[col.key as keyof T] ?? "")}
                    </td>
                  ))}
                </tr>
              ))
            )}
            {padBottom > 0 ? (
              <tr aria-hidden style={{ height: padBottom }}>
                <td colSpan={columns.length} />
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      <nav
        aria-label="Table pagination"
        className="flex items-center justify-between border-t border-line px-4 py-3"
      >
        <p className="text-xs text-slate-500">
          Showing{" "}
          <span className="font-mono">
            {sorted.length === 0 ? 0 : (safePage - 1) * pageSize + 1}–
            {Math.min(safePage * pageSize, sorted.length)}
          </span>{" "}
          of <span className="font-mono">{sorted.length}</span> records
        </p>
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            disabled={safePage <= 1}
            onClick={() => setPage(safePage - 1)}
          >
            Previous
          </Button>
          {Array.from({ length: pageCount }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPage(p)}
              aria-current={p === safePage ? "page" : undefined}
              className={cn(
                "h-7 w-7 rounded-md text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50",
                p === safePage
                  ? "bg-accent text-white"
                  : "text-slate-600 hover:bg-slate-100",
              )}
            >
              {p}
            </button>
          ))}
          <Button
            size="sm"
            variant="ghost"
            disabled={safePage >= pageCount}
            onClick={() => setPage(safePage + 1)}
          >
            Next
          </Button>
        </div>
      </nav>
    </div>
  );
}
