"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "danger" | "ghost";
type Size = "sm" | "md";

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-accent text-white hover:bg-accent-dark focus-visible:ring-accent/50 border border-accent",
  secondary:
    "bg-white text-slate-700 hover:bg-slate-50 focus-visible:ring-accent/40 border border-line",
  danger:
    "bg-status-rejected text-white hover:bg-red-600 focus-visible:ring-red-300 border border-status-rejected",
  ghost:
    "bg-transparent text-slate-600 hover:bg-slate-100 focus-visible:ring-accent/40 border border-transparent",
};

const sizeClasses: Record<Size, string> = {
  sm: "px-2.5 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className, type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    />
  ),
);
Button.displayName = "Button";
