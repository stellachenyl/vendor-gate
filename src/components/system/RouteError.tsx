"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/Button";

export interface RouteErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Shared route-segment error boundary body. Rendered by each section's
 * error.tsx so a crash in one widget never takes down the whole portal.
 */
export function RouteError({ error, reset }: RouteErrorProps) {
  useEffect(() => {
    // Observability hook: surface the digest for server-side correlation.
    console.error("Section render failed:", error);
  }, [error]);

  return (
    <div className="card mx-auto max-w-lg p-10 text-center" role="alert">
      <h1 className="text-base font-semibold text-slate-900">
        Something went wrong in this section
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        The rest of the portal is unaffected.
        {error.digest ? (
          <>
            {" "}
            Reference: <span className="font-mono text-xs">{error.digest}</span>
          </>
        ) : null}
      </p>
      <div className="mt-4 flex justify-center gap-2">
        <Button onClick={() => reset()}>Try again</Button>
        <Link
          href="/dashboard"
          className="inline-flex items-center rounded-md border border-line bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
