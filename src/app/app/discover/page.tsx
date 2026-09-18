"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Bell, Search } from "lucide-react";
import { FeedTabs } from "@/components/consumer/FeedTabs";
import { Chip } from "@/components/ui/Chip";
import { ProductCard } from "@/components/consumer/ProductCard";
import { useAppStore } from "@/store/useAppStore";
import { useData } from "@/contexts/DataContext";
import { useConsumerAuth } from "@/contexts/ConsumerAuthContext";
import type { Category } from "@/types";

const filters: (Category | "Trending" | "Voor jou" | "Dichtbij" | "Experiences")[] = [
  "Trending",
  "Voor jou",
  "Dichtbij",
  "Fashion",
  "Food",
  "Tech",
  "Travel",
  "Fitness",
  "Events",
  "Beauty",
  "Experiences",
];

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="mb-7">
      <div className="px-4 mb-3">
        <h2 className="font-heading font-bold text-base">{title}</h2>
        {subtitle && <p className="text-xs text-white/40 mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex gap-3 overflow-x-auto no-scrollbar px-4">{children}</div>
    </section>
  );
}

export default function DiscoverPage() {
  const [active, setActive] = useState<(typeof filters)[number]>("Trending");
  const interests = useAppStore((s) => s.interests);
  const savedProductIds = useAppStore((s) => s.savedProductIds);
  const toggleSave = useAppStore((s) => s.toggleSave);
  const { requireAuth } = useConsumerAuth();
  const { products, companies } = useData();
  const getCompany = (id: string) => companies.find((c) => c.id === id);

  const filtered = useMemo(() => {
    if (active === "Trending" || active === "Dichtbij" || active === "Experiences") return products;
    if (active === "Voor jou") return products.filter((p) => interests.includes(p.category));
    return products.filter((p) => p.category === active);
  }, [active, interests, products]);

  const trending = [...filtered].slice().reverse();
  const nearYou = filtered.slice(2).concat(filtered.slice(0, 2));
  const deals = filtered.filter((p) => p.oldPrice);
  const almostGone = filtered.slice(0, 5);
  const forYou = filtered.filter((p) => interests.includes(p.category));

  return (
    <div className="min-h-full pb-28">
      <header className="sticky top-0 z-30 flex items-center gap-3 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] bg-indigo/85 backdrop-blur-xl border-b border-white/5">
        <FeedTabs active="discover" />
        <button aria-label="Meldingen" className="ml-auto rounded-full p-1.5 hover:bg-white/10">
          <Bell size={20} />
        </button>
      </header>
      <div className="px-4 pb-1">
        <Link
          href="/app/search"
          className="flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white/40"
        >
          <Search size={16} /> Zoek merken, producten, deals...
        </Link>
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar px-4 py-4">
        {filters.map((f) => (
          <Chip key={f} active={active === f} onClick={() => setActive(f)}>
            {f}
          </Chip>
        ))}
      </div>

      <Section title="Trending op Swyp" subtitle="Meest bekeken deze week">
        {trending.slice(0, 8).map((p) => (
          <ProductCard
            key={p.id}
            product={p}
            company={getCompany(p.companyId)}
            className="w-[150px] shrink-0"
            saved={!!savedProductIds[p.id]}
            onToggleSave={() => requireAuth() && toggleSave(p.id, `discover-${p.id}`, 3)}
          />
        ))}
      </Section>

      {forYou.length > 0 && (
        <Section title="Speciaal voor jou" subtitle="Op basis van je interesses">
          {forYou.slice(0, 8).map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              company={getCompany(p.companyId)}
              className="w-[150px] shrink-0"
              saved={!!savedProductIds[p.id]}
              onToggleSave={() => requireAuth() && toggleSave(p.id, `discover-${p.id}`, 3)}
            />
          ))}
        </Section>
      )}

      <Section title="Populair bij jou in de buurt" subtitle="Amsterdam en omgeving">
        {nearYou.slice(0, 8).map((p) => (
          <ProductCard
            key={p.id}
            product={p}
            company={getCompany(p.companyId)}
            className="w-[150px] shrink-0"
            saved={!!savedProductIds[p.id]}
            onToggleSave={() => requireAuth() && toggleSave(p.id, `discover-${p.id}`, 3)}
          />
        ))}
      </Section>

      {deals.length > 0 && (
        <Section title="Nieuwe deals" subtitle="Tijdelijk extra korting">
          {deals.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              company={getCompany(p.companyId)}
              className="w-[150px] shrink-0"
              saved={!!savedProductIds[p.id]}
              onToggleSave={() => requireAuth() && toggleSave(p.id, `discover-${p.id}`, 3)}
            />
          ))}
        </Section>
      )}

      <Section title="Bijna uitverkocht" subtitle="Wees er snel bij">
        {almostGone.map((p) => (
          <ProductCard
            key={p.id}
            product={p}
            company={getCompany(p.companyId)}
            className="w-[150px] shrink-0"
            saved={!!savedProductIds[p.id]}
            onToggleSave={() => requireAuth() && toggleSave(p.id, `discover-${p.id}`, 3)}
          />
        ))}
      </Section>
    </div>
  );
}
