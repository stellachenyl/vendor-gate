"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/FormControls";
import { useToast } from "@/components/ui/Toast";
import { suppliers } from "@/lib/mock-data";

export default function NewNcrPage() {
  const router = useRouter();
  const { showToast } = useToast();

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="page-title">Raise Nonconformance Report</h1>
      <p className="mt-0.5 text-sm text-slate-500">
        Complete D2 at minimum. The responsible supplier quality representative is
        notified on submission.
      </p>

      <form
        className="card mt-4 space-y-4 p-5"
        onSubmit={(e) => {
          e.preventDefault();
          showToast(
            "NCR draft saved and routed to Supplier Quality Engineering.",
            "success",
          );
          router.push("/ncrs");
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Part Number" required placeholder="e.g. TNX-3320-D" />
          <Input label="Lot Number" placeholder="e.g. LOT-2026-08110" />
        </div>
        <Select
          label="Supplier"
          required
          defaultValue=""
          options={[
            { value: "", label: "Select supplier…" },
            ...suppliers.map((s) => ({ value: s.id, label: `${s.name} (${s.code})` })),
          ]}
        />
        <Select
          label="Priority"
          defaultValue="Major"
          options={[
            { value: "Critical", label: "Critical" },
            { value: "Major", label: "Major" },
            { value: "Minor", label: "Minor" },
            { value: "Observation", label: "Observation" },
          ]}
        />
        <Textarea
          label="Defect Description (D2)"
          required
          rows={5}
          placeholder="Characteristic affected, specification vs. actual measurement, quantity in question, detection point (goods-in, line-side, customer)…"
        />
        <Textarea
          label="Interim Containment (D3, if known)"
          rows={3}
          placeholder="Quarantine location, stock verification status, interim inspection instructions…"
        />
        <div className="flex justify-end gap-2 border-t border-line pt-4">
          <Button variant="secondary" onClick={() => router.push("/ncrs")}>
            Cancel
          </Button>
          <Button type="submit">Submit NCR</Button>
        </div>
      </form>
    </div>
  );
}
