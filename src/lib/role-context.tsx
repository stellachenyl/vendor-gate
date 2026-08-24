"use client";

import { createContext, useContext, useMemo, useState } from "react";
import type { UserRole } from "./types";

interface RoleContextValue {
  role: UserRole;
  /** For Supplier User, the supplier they belong to. */
  supplierId: string | null;
  setRole: (role: UserRole) => void;
  /** True when the current role may view the given record's owner. */
  canView: (ownerSupplierId: string) => boolean;
}

const RoleContext = createContext<RoleContextValue | null>(null);

const SUPPLIER_PORTAL_SUPPLIER_ID = "SUP-003"; // Cascade Polymer Solutions

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<UserRole>("Quality Manager");

  const value = useMemo<RoleContextValue>(
    () => ({
      role,
      supplierId: role === "Supplier User" ? SUPPLIER_PORTAL_SUPPLIER_ID : null,
      setRole,
      canView: (ownerSupplierId: string) =>
        role === "Quality Manager" || ownerSupplierId === SUPPLIER_PORTAL_SUPPLIER_ID,
    }),
    [role],
  );

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole(): RoleContextValue {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRole must be used within RoleProvider");
  return ctx;
}
