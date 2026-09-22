"use client";

import { use, useState } from "react";
import Image from "next/image";
import { MapPin, Globe } from "lucide-react";
import { TopBar } from "@/components/consumer/TopBar";
import { CompanyAvatar } from "@/components/ui/CompanyAvatar";
import { Button } from "@/components/ui/Button";
import { ProductCard } from "@/components/consumer/ProductCard";
import { RewardCard } from "@/components/consumer/RewardCard";
import { useWallet } from "@/contexts/WalletContext";
import { useData } from "@/contexts/DataContext";
import { useConsumerAuth } from "@/contexts/ConsumerAuthContext";
import { formatNumber } from "@/lib/utils";

const tabs = ["Ads", "Deals", "Over"] as const;

export default function CompanyProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { companies, products: allProducts, rewards: allRewards, ads } = useData();
  const company = companies.find((c) => c.id === id);
  const [tab, setTab] = useState<(typeof tabs)[number]>("Ads");

  const { followedCompanyIds, toggleFollow, savedProductIds, toggleSave } = useWallet();
  const followed = followedCompanyIds.has(id);
  const { requireAuth } = useConsumerAuth();

  if (!company) {
    return (
      <div className="p-6">
        <TopBar back />
        <p className="text-white/50 text-sm">Bedrijf niet gevonden.</p>
      </div>
    );
  }

  const products = allProducts.filter((p) => p.companyId === company.id);
  const rewards = allRewards.filter((r) => r.companyId === company.id);
  const followerCount = company.followers + (followed ? 1 : 0);

  return (
    <div className="min-h-full pb-28">
      <TopBar back transparent />

      <div className="relative -mt-14 w-full aspect-[16/9]">
        <Image src={company.bannerUrl} alt="" fill className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-indigo via-transparent to-black/30" />
      </div>

      <div className="px-4 -mt-10 relative">
        <CompanyAvatar src={company.logoUrl} name={company.name} verified={company.verified} size={72} className="border-4 border-indigo rounded-full mb-3" />
        <div className="flex items-start justify-between mb-2">
          <div>
            <h1 className="font-heading text-xl font-bold">{company.name}</h1>
            <p className="text-xs text-white/40 mt-1">
              {formatNumber(followerCount)} volgers · {company.category}
            </p>
          </div>
          <Button size="sm" variant={followed ? "secondary" : "primary"} onClick={() => requireAuth() && toggleFollow(company.id)}>
            {followed ? "Volgend" : "Volgen"}
          </Button>
        </div>

        <div className="flex items-center gap-4 text-xs text-white/50 mb-4">
          <span className="flex items-center gap-1">
            <MapPin size={13} /> {company.location}
          </span>
          <span className="flex items-center gap-1">
            <Globe size={13} /> {company.website}
          </span>
        </div>

        <div className="flex gap-2 mb-4">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium border ${
                tab === t ? "bg-white text-indigo border-transparent" : "border-white/15 text-white/60"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === "Ads" && (
          <div className="grid grid-cols-2 gap-3">
            {products.map((p) => {
              const productAd = ads.find((a) => a.productId === p.id);
              return (
                <ProductCard
                  key={p.id}
                  product={p}
                  company={company}
                  saved={savedProductIds.has(p.id)}
                  onToggleSave={() => productAd && requireAuth() && toggleSave(p.id, productAd.id)}
                />
              );
            })}
          </div>
        )}

        {tab === "Deals" && (
          <div className="grid grid-cols-2 gap-3">
            {rewards.length === 0 ? (
              <p className="text-sm text-white/40 col-span-2">Nog geen deals van dit bedrijf.</p>
            ) : (
              rewards.map((r) => <RewardCard key={r.id} reward={r} company={company} />)
            )}
          </div>
        )}

        {tab === "Over" && (
          <p className="text-sm text-white/60 leading-relaxed">{company.description}</p>
        )}
      </div>
    </div>
  );
}
