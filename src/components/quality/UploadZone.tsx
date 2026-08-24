"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_EXTENSIONS = ["pdf", "docx", "xlsx"];
const UPLOAD_DURATION_MS = 2000;

interface ActiveUpload {
  name: string;
  progress: number;
}

function validateFile(file: File): string | null {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return `Unsupported format: ${file.name} (allowed: ${ALLOWED_EXTENSIONS.join(", ")})`;
  }
  if (file.size > MAX_BYTES) {
    return `File exceeds 10MB limit: ${file.name}`;
  }
  return null;
}

/** Mock upload zone: validates client-side and animates a 2s progress bar. */
export function UploadZone({ label = "Upload document" }: { label?: string }) {
  const { showToast } = useToast();
  const [dragging, setDragging] = useState(false);
  const [uploads, setUploads] = useState<ActiveUpload[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const startUploads = (files: File[]) => {
    const rejected: string[] = [];
    const accepted: string[] = [];
    for (const file of files) {
      const problem = validateFile(file);
      if (problem) {
        rejected.push(problem);
      } else {
        accepted.push(file.name);
      }
    }
    for (const message of rejected) showToast(message, "error");
    if (accepted.length === 0) return;

    setUploads(accepted.map((name) => ({ name, progress: 0 })));
    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const pct = Math.min(100, Math.round((elapsed / UPLOAD_DURATION_MS) * 100));
      setUploads((prev) =>
        prev.map((u) => ({ ...u, progress: pct })),
      );
      if (pct >= 100) {
        window.clearInterval(timer);
        showToast(`Upload complete: ${accepted.join(", ")}`, "success");
      }
    }, 50);
  };

  return (
    <div>
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
          startUploads(Array.from(e.dataTransfer.files));
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
          dragging
            ? "border-accent bg-accent-soft"
            : "border-line bg-slate-50/60 hover:bg-slate-50",
        )}
      >
        <p className="text-sm font-medium text-slate-600">
          Drag &amp; drop files here, or{" "}
          <span className="text-accent">browse</span>
        </p>
        <p className="text-xs text-slate-400">PDF, DOCX, XLSX up to 10 MB</p>
        {/* Hidden input: files never leave the browser in this demo. */}
        <input
          ref={inputRef}
          type="file"
          multiple
          className="sr-only"
          onChange={(e) => {
            startUploads(Array.from(e.target.files ?? []));
            e.target.value = "";
          }}
        />
      </div>

      {uploads.length > 0 ? (
        <ul role="list" className="mt-3 space-y-2">
          {uploads.map((upload) => (
            <li key={upload.name}>
              <div className="flex items-center justify-between font-mono text-xs text-slate-500">
                <span className="truncate">{upload.name}</span>
                <span>{upload.progress}%</span>
              </div>
              <div
                role="progressbar"
                aria-label={`Uploading ${upload.name}`}
                aria-valuenow={upload.progress}
                aria-valuemin={0}
                aria-valuemax={100}
                className="h-1.5 overflow-hidden rounded-full bg-slate-200"
              >
                <div
                  className="h-full rounded-full bg-accent transition-[width] duration-75"
                  style={{ width: `${upload.progress}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function UploadZoneCard() {
  const { showToast } = useToast();
  return (
    <div className="card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-800">Upload Document</h2>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => showToast("Upload guidelines opened.", "info")}
        >
          Guidelines
        </Button>
      </div>
      <UploadZone />
    </div>
  );
}
