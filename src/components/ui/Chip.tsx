import { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
}

export function Chip({ active, className, children, ...props }: ChipProps) {
  return (
    <button
      className={cn(
        "shrink-0 rounded-full px-4 py-2 text-sm font-medium border transition-colors",
        active
          ? "bg-gradient-to-r from-violet to-magenta text-white border-transparent"
          : "bg-white/5 text-white/70 border-white/10 hover:bg-white/10 hover:text-white",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
