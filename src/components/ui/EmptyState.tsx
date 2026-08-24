export interface EmptyStateProps {
  title: string;
  hint?: string;
}

/** Shared empty-state card; copy is always text (never color-only). */
export function EmptyState({ title, hint }: EmptyStateProps) {
  return (
    <div
      role="status"
      className="card px-6 py-12 text-center"
      data-testid="empty-state"
    >
      <p aria-hidden className="mb-2 text-3xl">
        🗂️
      </p>
      <p className="text-sm font-semibold text-slate-800">{title}</p>
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}
