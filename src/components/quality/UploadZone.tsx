"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";

/** Mock drag-and-drop upload zone. No files leave the browser. */
export function UploadZone({ label = "Upload document" }: { label?: string }) {
  const { showToast } = useToast();
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={label}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        const names = Array.from(e.dataTransfer.files).map((f) => f.name);
        showToast(
          names.length > 0
            ? `Queued for scan: ${names.join(", ")}`
            : "No files detected in drop.",
          names.length > 0 ? "info" : "error",
        );
      }}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed px-6 py-8 text-center transition-colors",
        dragging ? "border-accent bg-accent-soft" : "border-line bg-slate-50/60 hover:bg-slate-50",
      )}
    >
      <p className="text-sm font-medium text-slate-600">
        Drag &amp; drop files here, or <span className="text-accent">browse</span>
      </p>
      <p className="text-xs text-slate-400">PDF, DOCX, XLSX up to 25 MB</p>
      {/* Mock input: selection is never uploaded anywhere. */}
      <input
        ref={inputRef}
        type="file"
        multiple
        className="sr-only"
        onChange={(e) => {
          const names = Array.from(e.target.files ?? []).map((f) => f.name);
          if (names.length > 0) {
            showToast(`Queued for scan: ${names.join(", ")}`, "info");
          }
          e.target.value = "";
        }}
      />
    </div>
  );
}

export function UploadZoneCard() {
  const { showToast } = useToast();
  return (
    <div className="card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-800">Upload Document</h2>
        <Button size="sm" variant="secondary" onClick={() => showToast("Upload guidelines opened.", "info")}>
          Guidelines
        </Button>
      </div>
      <UploadZone />
    </div>
  );
}
