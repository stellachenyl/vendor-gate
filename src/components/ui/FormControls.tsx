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

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, id, className, ...props }, ref) => {
    const autoId = useId();
    const inputId = id ?? autoId;
    return (
      <div className="w-full">
        <FieldLabel label={label} htmlFor={inputId} />
        <input
          ref={ref}
          id={inputId}
          className={cn(fieldClasses, className)}
          {...props}
        />
      </div>
    );
  },
);
Input.displayName = "Input";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, id, className, rows = 4, ...props }, ref) => {
    const autoId = useId();
    const inputId = id ?? autoId;
    return (
      <div className="w-full">
        <FieldLabel label={label} htmlFor={inputId} />
        <textarea
          ref={ref}
          id={inputId}
          rows={rows}
          className={cn(fieldClasses, className)}
          {...props}
        />
      </div>
    );
  },
);
Textarea.displayName = "Textarea";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: ReadonlyArray<{ value: string; label: string }>;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, id, options, className, ...props }, ref) => {
    const autoId = useId();
    const inputId = id ?? autoId;
    return (
      <div className="w-full">
        <FieldLabel label={label} htmlFor={inputId} />
        <select ref={ref} id={inputId} className={cn(fieldClasses, className)} {...props}>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    );
  },
);
Select.displayName = "Select";
