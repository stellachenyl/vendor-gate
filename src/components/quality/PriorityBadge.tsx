"use client";

import { useEffect, useRef, useState } from "react";
import type { Priority, RiskTier } from "@/lib/types";
import { cn, prefersReducedMotion } from "@/lib/utils";

const priorityStyles: Record<Priority, string> = {
  Critical: "bg-red-50 text-red-700 border-status-rejected",
  Major: "bg-orange-50 text-orange-700 border-risk-high",
  Minor: "bg-amber-50 text-amber-700 border-status-conditional",
  Observation: "bg-sky-50 text-sky-700 border-sky-400",
};

export function PriorityBadge({
  priority,
  className,
}: {
  priority: Priority;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold",
        priorityStyles[priority],
        className,
      )}
    >
      {priority}
    </span>
  );
}

const riskDot: Record<RiskTier, string> = {
  Low: "bg-risk-low",
  Medium: "bg-risk-medium",
  High: "bg-risk-high",
  Critical: "bg-risk-critical",
};

const riskText: Record<RiskTier, string> = {
  Low: "text-emerald-700 bg-emerald-50 border-emerald-300",
  Medium: "text-amber-700 bg-amber-50 border-amber-300",
  High: "text-orange-700 bg-orange-50 border-orange-300",
  Critical: "text-red-700 bg-red-50 border-red-300",
};

export function RiskTierBadge({ tier }: { tier: RiskTier }) {
  // Bounce once whenever the tier changes (skipped under reduced motion).
  const [bump, setBump] = useState(false);
  const prevTier = useRef(tier);

  useEffect(() => {
    if (prevTier.current === tier) return;
    prevTier.current = tier;
    if (prefersReducedMotion()) return;
    setBump(true);
    const timer = window.setTimeout(() => setBump(false), 400);
    return () => window.clearTimeout(timer);
  }, [tier]);

  return (
    <span
      data-bump={bump || undefined}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-semibold",
        riskText[tier],
        bump && "animate-bounce-once",
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", riskDot[tier])} aria-hidden />
      {tier}
    </span>
  );
}
