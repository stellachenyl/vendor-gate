"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/FormControls";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import type { RiskTier, SupplierCategory } from "@/lib/types";

const CATEGORIES: SupplierCategory[] = [
  "Machining",
  "Plastics",
  "Electronics",
  "Packaging",
  "Raw Material",
];
const RISK_TIERS: RiskTier[] = ["Low", "Medium", "High", "Critical"];

export function NewSupplierModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { showToast } = useToast();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");

  const valid = name.trim().length > 0 && code.trim().length > 0;

  const resetAndClose = () => {
    setName("");
    setCode("");
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={resetAndClose}
      title="Add Supplier"
      description="New suppliers enter the AVL in Pending status until onboarding and PPAP are complete."
      footer={
        <>
          <Button variant="secondary" onClick={resetAndClose}>
            Cancel
          </Button>
          <Button
            disabled={!valid}
            onClick={() => {
              showToast(`Supplier "${name}" created and queued for onboarding.`, "success");
              resetAndClose();
            }}
          >
            Create Supplier
          </Button>
        </>
      }
    >
      <form className="space-y-3" onSubmit={(e) => e.preventDefault()}>
        <Input
          label="Supplier Name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Meridian Tooling Sdn Bhd"
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            label="Code"
            required
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="MTS"
            maxLength={5}
          />
          <Select
            label="Category"
            options={CATEGORIES.map((c) => ({ value: c, label: c }))}
            defaultValue="Machining"
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Select
            label="Initial Risk Tier"
            options={RISK_TIERS.map((r) => ({ value: r, label: r }))}
            defaultValue="Medium"
          />
          <Input label="Contact Email" type="email" placeholder="quality@supplier.com" />
        </div>
        <Input label="Location" placeholder="City, Country" />
      </form>
    </Modal>
  );
}
