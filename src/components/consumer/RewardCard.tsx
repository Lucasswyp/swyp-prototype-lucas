import Link from "next/link";
import Image from "next/image";
import { TokenBadge } from "@/components/ui/TokenBadge";
import { cn } from "@/lib/utils";
import type { Reward, Company } from "@/types";

export function RewardCard({
  reward,
  company,
  className,
}: {
  reward: Reward;
  company?: Company;
  className?: string;
}) {
  return (
    <Link
      href={`/app/rewards/${reward.id}`}
      className={cn(
        "block rounded-2xl overflow-hidden border border-white/10 bg-white/[0.03] hover:border-white/20 transition-colors",
        className
      )}
    >
      <div className="relative aspect-[16/10] w-full">
        <Image src={reward.imageUrl} alt={reward.title} fill sizes="240px" className="object-cover" />
      </div>
      <div className="p-3">
        {company && <p className="text-[11px] text-white/40 mb-0.5 truncate">{company.name}</p>}
        <p className="text-sm font-semibold leading-snug line-clamp-1 mb-2">{reward.title}</p>
        <div className="flex items-center justify-between">
          <TokenBadge amount={reward.tokenCost} size="sm" />
          {reward.moneyValue && (
            <span className="text-[11px] text-white/40">t.w.v. €{reward.moneyValue.toFixed(2)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
