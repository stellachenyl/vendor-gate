"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/FormControls";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { getSupplier, suppliers } from "@/lib/mock-data";
import type { Priority } from "@/lib/types";
import { cn } from "@/lib/utils";

const STEPS = ["Details", "Containment & 8D", "Review"] as const;
const PRIORITIES: Array<Priority | ""> = ["", "Critical", "Major", "Minor", "Observation"];
const ROOT_CAUSE_CATEGORIES = [
  "Tooling Wear",
  "Process Out of Control",
  "Work Instruction Gap",
  "Material Substitution",
  "Training Gap",
  "Design Issue",
  "Unknown — Under Investigation",
];

export interface NewNcrWizardProps {
  open: boolean;
  onClose: () => void;
  initialSupplierId?: string;
  initialPartNumber?: string;
}

/** Three-step NCR intake: Details → Containment & 8D → Review & Submit. */
export function NewNcrWizard({
  open,
  onClose,
  initialSupplierId = "",
  initialPartNumber = "",
}: NewNcrWizardProps) {
  const { showToast } = useToast();
  const [step, setStep] = useState(0);
  const [supplierId, setSupplierId] = useState(initialSupplierId);
  const [partNumber, setPartNumber] = useState(initialPartNumber);
  const [lotNumber, setLotNumber] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<Priority | "">("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [containment, setContainment] = useState("");
  const [rootCauseCategory, setRootCauseCategory] = useState("");
  const [team, setTeam] = useState("");

  // D2 minimum: who, what part, what happened, how bad.
  const step1Valid =
    supplierId !== "" &&
    partNumber.trim() !== "" &&
    description.trim().length >= 20 &&
    severity !== "";

  const resetAndClose = () => {
    setStep(0);
    setSupplierId("");
    setPartNumber("");
    setLotNumber("");
    setDescription("");
    setSeverity("");
    setPhotos([]);
    setContainment("");
    setRootCauseCategory("");
    setTeam("");
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={resetAndClose}
      title="Raise Nonconformance Report"
      className="max-w-2xl"
      footer={
        <>
          <Button variant="ghost" onClick={resetAndClose}>
            Cancel
          </Button>
          {step > 0 ? (
            <Button variant="secondary" onClick={() => setStep(step - 1)}>
              Back
            </Button>
          ) : null}
          {step < 2 ? (
            <Button disabled={step === 0 && !step1Valid} onClick={() => setStep(step + 1)}>
              Next
            </Button>
          ) : (
            <Button
              onClick={() => {
                showToast("NCR submitted and routed to Supplier Quality Engineering.", "success");
                resetAndClose();
              }}
            >
              Submit NCR
            </Button>
          )}
        </>
      }
    >
      {/* Step indicator */}
      <ol className="mb-5 flex items-center gap-2" aria-label="Form progress">
        {STEPS.map((label, i) => (
          <li key={label} className="flex flex-1 items-center gap-2">
            <span
              aria-current={i === step ? "step" : undefined}
              className={cn(
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
                i < step && "bg-status-approved text-white",
                i === step && "bg-accent text-white",
                i > step && "bg-slate-100 text-slate-400",
              )}
            >
              {i < step ? "\u2713" : i + 1}
            </span>
            <span
              className={cn(
                "hidden text-xs font-medium sm:block",
                i === step ? "text-slate-800" : "text-slate-400",
              )}
            >
              {label}
            </span>
            {i < STEPS.length - 1 ? <span aria-hidden className="h-px flex-1 bg-line" /> : null}
          </li>
        ))}
      </ol>

      {step === 0 ? (
        <form className="space-y-3" onSubmit={(e) => e.preventDefault()} aria-label="Step 1: Details">
          <div className="grid gap-3 sm:grid-cols-2">
            <Select
              label="Supplier"
              required
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              options={[
                { value: "", label: "Select supplier…" },
                ...suppliers.map((s) => ({ value: s.id, label: `${s.name} (${s.code})` })),
              ]}
            />
            <Input
              label="Part Number"
              required
              value={partNumber}
              onChange={(e) => setPartNumber(e.target.value)}
              placeholder="e.g. TNX-3320-D"
            />
          </div>
          <Input
            label="Lot Number"
            value={lotNumber}
            onChange={(e) => setLotNumber(e.target.value)}
            placeholder="e.g. LOT-2026-08110"
          />
          <Textarea
            label="Defect Description (D2)"
            required
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Characteristic affected, measured vs. specified, quantity in question, detection point… (min. 20 characters)"
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Select
              label="Severity"
              required
              value={severity}
              onChange={(e) => setSeverity(e.target.value as Priority | "")}
              options={PRIORITIES.map((p) => ({
                value: p,
                label: p === "" ? "Select severity…" : p,
              }))}
            />
            <div>
              <p className="mb-1 block text-xs font-medium text-slate-600">Photos (optional)</p>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="secondary" onClick={() => setPhotos([...photos, `IMG_${1000 + photos.length}.jpg`])}>
                  Attach photo
                </Button>
                <span aria-live="polite" className="font-mono text-xs text-slate-400">
                  {photos.length} attached
                </span>
              </div>
              {photos.length > 0 ? (
                <ul className="mt-1 list-inside list-disc text-xs text-slate-500">
                  {photos.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>
        </form>
      ) : null}

      {step === 1 ? (
        <form className="space-y-3" onSubmit={(e) => e.preventDefault()} aria-label="Step 2: Containment and 8D">
          <Textarea
            label="Interim Containment Action (D3)"
            rows={3}
            value={containment}
            onChange={(e) => setContainment(e.target.value)}
            placeholder="Quarantine location, stock verification status, interim inspection instructions…"
          />
          <Select
            label="Root Cause Category"
            value={rootCauseCategory}
            onChange={(e) => setRootCauseCategory(e.target.value)}
            options={[
              { value: "", label: "Unknown — to be confirmed at D4" },
              ...ROOT_CAUSE_CATEGORIES.filter((c) => c !== "Unknown — Under Investigation").map((c) => ({
                value: c,
                label: c,
              })),
            ]}
          />
          <Input
            label="8D Team Members (comma-separated)"
            value={team}
            onChange={(e) => setTeam(e.target.value)}
            placeholder="L. Brennan (lead), R. Okafor, Supplier Quality Rep"
          />
        </form>
      ) : null}

      {step === 2 ? (
        <div className="space-y-3" aria-label="Step 3: Review and submit">
          <dl className="grid grid-cols-[130px_1fr] gap-x-3 gap-y-2 rounded-md border border-line bg-slate-50/60 p-4 text-sm">
            <dt className="font-medium text-slate-500">Supplier</dt>
            <dd className="text-slate-800">{getSupplier(supplierId)?.name ?? supplierId}</dd>
            <dt className="font-medium text-slate-500">Part / Lot</dt>
            <dd className="font-mono text-slate-800">
              {partNumber || "—"} · {lotNumber || "no lot"}
            </dd>
            <dt className="font-medium text-slate-500">Severity</dt>
            <dd className="text-slate-800">{severity}</dd>
            <dt className="font-medium text-slate-500">Description</dt>
            <dd className="leading-relaxed text-slate-800">{description}</dd>
            <dt className="font-medium text-slate-500">Containment</dt>
            <dd className="leading-relaxed text-slate-800">{containment || "None recorded yet."}</dd>
            <dt className="font-medium text-slate-500">Root Cause Cat.</dt>
            <dd className="text-slate-800">{rootCauseCategory || "Unknown — to be confirmed at D4"}</dd>
            <dt className="font-medium text-slate-500">8D Team</dt>
            <dd className="text-slate-800">{team || "To be assigned"}</dd>
            <dt className="font-medium text-slate-500">Photos</dt>
            <dd className="text-slate-800">{photos.length > 0 ? photos.join(", ") : "None"}</dd>
          </dl>
          <p className="text-xs text-slate-500">
            Submitting notifies the supplier quality representative and opens the 8D tracker.
          </p>
        </div>
      ) : null}
    </Modal>
  );
}
