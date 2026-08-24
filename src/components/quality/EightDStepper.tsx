import type { NcrStep } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface EightDStepperProps {
  progress: ReadonlyArray<NcrStep>;
  size?: "sm" | "lg";
}

/**
 * Visual D1–D8 stepper. Each step is completed (filled), current (first
 * pending — accent ring), or pending (muted).
 */
export function EightDStepper({ progress, size = "sm" }: EightDStepperProps) {
  const doneCount = progress.filter((s) => s.done).length;
  const currentIndex = progress.findIndex((s) => !s.done);
  const dotSize = size === "lg" ? "h-10 w-10 text-sm" : "h-7 w-7 text-[10px]";

  return (
    <div role="group" aria-label={`8D progress: ${doneCount} of ${progress.length} steps complete`}>
      <ol className="flex flex-wrap gap-x-1 gap-y-2">
        {progress.map((step, i) => {
          const state =
            step.done ? "completed" : i === currentIndex ? "current" : "pending";
          return (
            <li key={step.step} className="flex min-w-[72px] flex-1 items-center">
              <div className="flex w-full flex-col items-center text-center">
                <span
                  data-state={state}
                  aria-current={state === "current" ? "step" : undefined}
                  className={cn(
                    "flex items-center justify-center rounded-full border-2 font-bold",
                    dotSize,
                    state === "completed" &&
                      "border-status-approved bg-status-approved text-white",
                    state === "current" &&
                      "border-accent bg-accent-soft text-accent ring-2 ring-accent/30",
                    state === "pending" && "border-line bg-slate-50 text-slate-400",
                  )}
                >
                  {step.done ? "\u2713" : step.step.replace("D", "")}
                </span>
                <span
                  className={cn(
                    "mt-1 text-[10px] leading-tight",
                    size === "lg" && "text-xs",
                    state === "pending" ? "text-slate-400" : "text-slate-700",
                  )}
                >
                  {step.label}
                </span>
              </div>
              {i < progress.length - 1 ? (
                <span
                  aria-hidden
                  className={cn(
                    "mx-0.5 mb-4 h-0.5 flex-1 rounded",
                    step.done ? "bg-status-approved" : "bg-line",
                  )}
                />
              ) : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
