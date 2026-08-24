"use client";

import { forwardRef, useId } from "react";
import { cn } from "@/lib/utils";

const fieldClasses =
  "w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:bg-slate-50 disabled:text-slate-400";

function FieldLabel({ label, htmlFor }: { label?: string; htmlFor: string }) {
  if (!label) return null;
  return (
    <label htmlFor={htmlFor} className="mb-1 block text-xs font-medium text-slate-600">
      {label}
    </label>
  );
}

function FieldError({ error, id }: { error?: string; id: string }) {
  if (!error) return null;
  return (
    <p id={id} role="alert" className="mt-1 text-xs font-medium text-status-rejected">
      {error}
    </p>
  );
}

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  /** Inline validation message rendered under the field. */
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, id, className, error, ...props }, ref) => {
    const autoId = useId();
    const inputId = id ?? autoId;
    const describedBy = error ? `${inputId}-error` : props["aria-describedby"];
    return (
      <div className="w-full">
        <FieldLabel label={label} htmlFor={inputId} />
        <input
          ref={ref}
          id={inputId}
          className={cn(fieldClasses, error && "border-status-rejected", className)}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          {...props}
        />
        <FieldError error={error} id={`${inputId}-error`} />
      </div>
    );
  },
);
Input.displayName = "Input";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, id, className, rows = 4, error, ...props }, ref) => {
    const autoId = useId();
    const inputId = id ?? autoId;
    const describedBy = error ? `${inputId}-error` : props["aria-describedby"];
    return (
      <div className="w-full">
        <FieldLabel label={label} htmlFor={inputId} />
        <textarea
          ref={ref}
          id={inputId}
          rows={rows}
          className={cn(fieldClasses, error && "border-status-rejected", className)}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          {...props}
        />
        <FieldError error={error} id={`${inputId}-error`} />
      </div>
    );
  },
);
Textarea.displayName = "Textarea";

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: ReadonlyArray<{ value: string; label: string }>;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, id, options, className, error, ...props }, ref) => {
    const autoId = useId();
    const inputId = id ?? autoId;
    const describedBy = error ? `${inputId}-error` : props["aria-describedby"];
    return (
      <div className="w-full">
        <FieldLabel label={label} htmlFor={inputId} />
        <select
          ref={ref}
          id={inputId}
          className={cn(fieldClasses, error && "border-status-rejected", className)}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <FieldError error={error} id={`${inputId}-error`} />
      </div>
    );
  },
);
Select.displayName = "Select";
