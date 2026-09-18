import { cn } from "@/lib/utils";

export function ProgressBar({
  value,
  max = 100,
  className,
  barClassName,
}: {
  value: number;
  max?: number;
  className?: string;
  barClassName?: string;
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className={cn("h-1.5 w-full rounded-full bg-white/10 overflow-hidden", className)}>
      <div
        className={cn("h-full rounded-full bg-gradient-to-r from-violet to-magenta transition-all duration-300", barClassName)}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
