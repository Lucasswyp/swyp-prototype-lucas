import { LucideIcon, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

export function MetricCard({
  label,
  value,
  delta,
  icon: Icon,
}: {
  label: string;
  value: string;
  delta?: number;
  icon?: LucideIcon;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-white/45 font-medium">{label}</p>
        {Icon && <Icon size={15} className="text-white/30" />}
      </div>
      <p className="font-heading text-2xl font-extrabold tabular-nums mb-1">{value}</p>
      {delta !== undefined && (
        <span
          className={cn(
            "inline-flex items-center gap-0.5 text-xs font-semibold",
            delta >= 0 ? "text-emerald-400" : "text-red-400"
          )}
        >
          {delta >= 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
          {Math.abs(delta)}% vs vorige periode
        </span>
      )}
    </Card>
  );
}
