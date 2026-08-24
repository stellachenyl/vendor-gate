"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { cn, exportToCsv } from "@/lib/utils";

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
}

type SortState = { key: string; direction: "asc" | "desc" } | null;

export function DataTable<T>({
  columns,
  data,
  rowKey,
  pageSize = 8,
  csvFilename,
  caption,
}: DataTableProps<T>) {
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<SortState>(null);

  const sorted = useMemo(() => {
    if (!sort) return data;
    const col = columns.find((c) => c.key === sort.key);
    const getVal = (row: T): string | number =>
      col?.value ? col.value(row) : String(row[sort.key as keyof T] ?? "");
    return [...data].sort((a, b) => {
      const va = getVal(a);
      const vb = getVal(b);
      const cmp =
        typeof va === "number" && typeof vb === "number"
          ? va - vb
          : String(va).localeCompare(String(vb));
      return sort.direction === "asc" ? cmp : -cmp;
    });
  }, [data, sort, columns]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const pageRows = sorted.slice((safePage - 1) * pageSize, safePage * pageSize);

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
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
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
            {pageRows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-10 text-center text-sm text-slate-400"
                >
                  No records match the current filters.
                </td>
              </tr>
            ) : (
              pageRows.map((row) => (
                <tr
                  key={rowKey(row)}
                  className="border-b border-line last:border-b-0 hover:bg-accent-soft/40"
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
