"use client";

import { useMemo, useState } from "react";
import { Search as SearchIcon, X } from "lucide-react";
import { TopBar } from "@/components/consumer/TopBar";
import { ProductCard } from "@/components/consumer/ProductCard";
import { RewardCard } from "@/components/consumer/RewardCard";
import { CompanyAvatar } from "@/components/ui/CompanyAvatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { useAppStore } from "@/store/useAppStore";
import { useData } from "@/contexts/DataContext";
import { useConsumerAuth } from "@/contexts/ConsumerAuthContext";
import Link from "next/link";

export default function SearchPage() {
  const [q, setQ] = useState("");
  const savedProductIds = useAppStore((s) => s.savedProductIds);
  const toggleSave = useAppStore((s) => s.toggleSave);
  const { requireAuth } = useConsumerAuth();
  const { products, companies, rewards } = useData();
  const getCompany = (id: string) => companies.find((c) => c.id === id);

  const query = q.trim().toLowerCase();

  const results = useMemo(() => {
    if (!query) return null;
    return {
      companies: companies.filter(
        (c) => c.name.toLowerCase().includes(query) || c.location.toLowerCase().includes(query) || c.category.toLowerCase().includes(query)
      ),
      products: products.filter(
        (p) => p.name.toLowerCase().includes(query) || p.description.toLowerCase().includes(query) || p.category.toLowerCase().includes(query)
      ),
      rewards: rewards.filter((r) => r.title.toLowerCase().includes(query) || r.category.toLowerCase().includes(query)),
    };
  }, [query, products, companies, rewards]);

  const suggestions = ["Nike", "Pizza", "Amsterdam", "Hotel", "Sneakers", "Fitness", "Festival"];
  const noResults =
    results && results.companies.length === 0 && results.products.length === 0 && results.rewards.length === 0;

  return (
    <div className="min-h-full pb-28">
      <TopBar back />
      <div className="px-4 -mt-1 pb-4">
        <div className="flex items-center gap-2 rounded-xl bg-white/5 border border-white/15 px-3 py-2.5">
          <SearchIcon size={18} className="text-white/40" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek merken, producten, deals..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-white/30"
          />
          {q && (
            <button onClick={() => setQ("")} aria-label="Wissen">
              <X size={16} className="text-white/40" />
            </button>
          )}
        </div>
      </div>

      {!results && (
        <div className="px-4">
          <p className="text-xs font-semibold text-white/40 mb-2 uppercase tracking-wide">Suggesties</p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => setQ(s)}
                className="rounded-full bg-white/5 border border-white/10 px-3.5 py-1.5 text-sm text-white/70"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {noResults && (
        <EmptyState
          icon={SearchIcon}
          title={`Geen resultaten voor "${q}"`}
          description="Probeer een andere zoekterm of bekijk onze suggesties."
        />
      )}

      {results && results.companies.length > 0 && (
        <section className="px-4 mb-6">
          <h2 className="font-heading font-bold text-sm mb-2 text-white/50 uppercase tracking-wide">Bedrijven</h2>
          <div className="flex flex-col gap-2">
            {results.companies.map((c) => (
              <Link key={c.id} href={`/app/company/${c.id}`} className="flex items-center gap-3 rounded-xl bg-white/[0.03] border border-white/10 p-2.5">
                <CompanyAvatar src={c.logoUrl} name={c.name} verified={c.verified} size={38} />
                <div>
                  <p className="text-sm font-semibold">{c.name}</p>
                  <p className="text-xs text-white/40">{c.category} · {c.location}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {results && results.products.length > 0 && (
        <section className="px-4 mb-6">
          <h2 className="font-heading font-bold text-sm mb-2 text-white/50 uppercase tracking-wide">Producten</h2>
          <div className="grid grid-cols-2 gap-3">
            {results.products.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                company={getCompany(p.companyId)}
                saved={!!savedProductIds[p.id]}
                onToggleSave={() => requireAuth() && toggleSave(p.id, `search-${p.id}`, 3)}
              />
            ))}
          </div>
        </section>
      )}

      {results && results.rewards.length > 0 && (
        <section className="px-4 mb-6">
          <h2 className="font-heading font-bold text-sm mb-2 text-white/50 uppercase tracking-wide">Rewards</h2>
          <div className="grid grid-cols-2 gap-3">
            {results.rewards.map((r) => (
              <RewardCard key={r.id} reward={r} company={getCompany(r.companyId)} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
