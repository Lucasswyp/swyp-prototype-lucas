import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center px-8 py-16">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 border border-white/10">
        <Icon size={26} className="text-white/50" />
      </div>
      <h3 className="font-heading font-bold text-lg mb-1.5">{title}</h3>
      <p className="text-sm text-white/50 max-w-xs mb-5">{description}</p>
      {action}
    </div>
  );
}
