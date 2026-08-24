import type { NcrStep } from "@/lib/types";

/** Builds an 8D progress array with the first `doneCount` steps completed. */
export function eightDSteps(doneCount: number): NcrStep[] {
  const labels = [
    "Team Formed",
    "Problem Described",
    "Containment",
    "Root Cause",
    "Corrective Actions",
    "Implemented",
    "Prevent Recurrence",
    "Team Recognition",
  ];
  return labels.map((label, i) => ({
    step: `D${i + 1}`,
    label,
    done: i < doneCount,
  }));
}
