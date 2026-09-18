"use client";

import { useState } from "react";
import Link from "next/link";
import { Ticket } from "lucide-react";
import { TopBar } from "@/components/consumer/TopBar";
import { Chip } from "@/components/ui/Chip";
import { RewardCard } from "@/components/consumer/RewardCard";
import { useData } from "@/contexts/DataContext";
import type { RewardCategory } from "@/types";

const categories: RewardCategory[] = [
  "Populair",
  "Eten & drinken",
  "Fashion",
  "Dagjes uit",
  "Travel",
  "Entertainment",
  "Fitness",
  "Beauty",
  "Tech",
];

export default function RewardsPage() {
  const [active, setActive] = useState<RewardCategory>("Populair");
  const { rewards, companies } = useData();
  const getCompany = (id: string) => companies.find((c) => c.id === id);

  const filtered = active === "Populair" ? rewards : rewards.filter((r) => r.category === active);

  return (
    <div className="min-h-full pb-28">
      <TopBar title="Rewards" />

      <div className="px-4 flex items-center justify-between mb-1">
        <p className="text-xs text-white/40">{rewards.length} rewards beschikbaar</p>
        <Link href="/app/my-rewards" className="flex items-center gap-1 text-xs font-semibold text-magenta">
          <Ticket size={14} /> Mijn rewards
        </Link>
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar px-4 py-3">
        {categories.map((c) => (
          <Chip key={c} active={active === c} onClick={() => setActive(c)}>
            {c}
          </Chip>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 px-4">
        {filtered.map((r) => (
          <RewardCard key={r.id} reward={r} company={getCompany(r.companyId)} />
        ))}
      </div>
    </div>
  );
}
