"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Bookmark } from "lucide-react";
import { TopBar } from "@/components/consumer/TopBar";
import { Chip } from "@/components/ui/Chip";
import { ProductCard } from "@/components/consumer/ProductCard";
import { CompanyAvatar } from "@/components/ui/CompanyAvatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { useWallet } from "@/contexts/WalletContext";
import { useData } from "@/contexts/DataContext";

const tabs = ["Alles", "Producten", "Deals", "Bedrijven"] as const;

export default function SavedPage() {
  const [tab, setTab] = useState<(typeof tabs)[number]>("Alles");
  const { savedProductIds, followedCompanyIds, toggleSave } = useWallet();
  const { products, companies } = useData();
  const getCompany = (id: string) => companies.find((c) => c.id === id);

  const savedProducts = useMemo(
    () => products.filter((p) => savedProductIds.has(p.id)),
    [savedProductIds, products]
  );
  const savedDeals = savedProducts.filter((p) => p.oldPrice);
  const savedCompanies = useMemo(
    () => companies.filter((c) => followedCompanyIds.has(c.id)),
    [followedCompanyIds, companies]
  );

  const isEmpty =
    savedProducts.length === 0 && savedCompanies.length === 0;

  return (
    <div className="min-h-full pb-28">
      <TopBar title="Saved" />

      {isEmpty ? (
        <EmptyState
          icon={Bookmark}
          title="Nog niets opgeslagen"
          description="Sla interessante producten en deals op en vind ze hier terug."
          action={
            <Link href="/app">
              <Button>Ontdek Swyps</Button>
            </Link>
          }
        />
      ) : (
        <>
          <div className="flex gap-2 overflow-x-auto no-scrollbar px-4 py-3">
            {tabs.map((t) => (
              <Chip key={t} active={tab === t} onClick={() => setTab(t)}>
                {t}
              </Chip>
            ))}
          </div>

          {(tab === "Alles" || tab === "Bedrijven") && savedCompanies.length > 0 && (
            <section className="px-4 mb-6">
              <h2 className="font-heading font-bold text-sm mb-2 text-white/50 uppercase tracking-wide">Bedrijven</h2>
              <div className="flex flex-col gap-2">
                {savedCompanies.map((c) => (
                  <Link
                    key={c.id}
                    href={`/app/company/${c.id}`}
                    className="flex items-center gap-3 rounded-xl bg-white/[0.03] border border-white/10 p-2.5"
                  >
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

          {(tab === "Alles" || tab === "Producten") && savedProducts.length > 0 && (
            <section className="px-4 mb-6">
              <h2 className="font-heading font-bold text-sm mb-2 text-white/50 uppercase tracking-wide">Producten</h2>
              <div className="grid grid-cols-2 gap-3">
                {savedProducts.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    company={getCompany(p.companyId)}
                    saved
                    onToggleSave={() => toggleSave(p.id, null)}
                  />
                ))}
              </div>
            </section>
          )}

          {tab === "Deals" && (
            <section className="px-4 mb-6">
              {savedDeals.length === 0 ? (
                <p className="text-sm text-white/40 px-1">Geen opgeslagen deals.</p>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {savedDeals.map((p) => (
                    <ProductCard
                      key={p.id}
                      product={p}
                      company={getCompany(p.companyId)}
                      saved
                      onToggleSave={() => toggleSave(p.id, null)}
                    />
                  ))}
                </div>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}
