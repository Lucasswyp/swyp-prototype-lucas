import { SwypToken } from "./SwypToken";
import { formatTokens } from "@/lib/utils";
import { cn } from "@/lib/utils";

export function TokenBadge({
  amount,
  size = "md",
  className,
}: {
  amount: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizeClasses = {
    sm: "text-xs px-2 py-1 gap-1",
    md: "text-sm px-3 py-1.5 gap-1.5",
    lg: "text-lg px-4 py-2 gap-2",
  }[size];
  const iconSize = { sm: 12, md: 16, lg: 20 }[size];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-white/10 bg-white/5 font-semibold tabular-nums",
        sizeClasses,
        className
      )}
    >
      <SwypToken size={iconSize} />
      {formatTokens(amount)}
    </span>
  );
}
