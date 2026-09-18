import { ReactNode } from "react";
import { Card } from "@/components/ui/Card";

export function ChartContainer({
  title,
  subtitle,
  children,
  height = 260,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  height?: number | string;
}) {
  return (
    <Card className="p-5">
      <div className="mb-4">
        <h3 className="font-heading font-bold text-sm">{title}</h3>
        {subtitle && <p className="text-xs text-white/40 mt-0.5">{subtitle}</p>}
      </div>
      <div style={{ height }}>{children}</div>
    </Card>
  );
}
