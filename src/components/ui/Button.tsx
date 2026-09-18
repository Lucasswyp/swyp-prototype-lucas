"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-gradient-to-r from-violet to-magenta text-white shadow-[0_0_20px_rgba(123,61,255,0.35)] hover:brightness-110 active:brightness-95",
  secondary:
    "bg-white/5 text-white border border-white/15 hover:bg-white/10 active:bg-white/15",
  ghost: "bg-transparent text-white/80 hover:text-white hover:bg-white/5",
  danger: "bg-red-500/15 text-red-300 border border-red-500/30 hover:bg-red-500/25",
};

const sizeClasses: Record<Size, string> = {
  sm: "text-sm px-3 py-1.5 rounded-lg gap-1.5",
  md: "text-sm px-4 py-2.5 rounded-xl gap-2",
  lg: "text-base px-5 py-3.5 rounded-2xl gap-2",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", fullWidth, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center font-semibold transition-all duration-150 disabled:opacity-40 disabled:pointer-events-none select-none",
          variantClasses[variant],
          sizeClasses[size],
          fullWidth && "w-full",
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
