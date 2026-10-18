"use client";

import { use, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { MapPin, Globe, MoreVertical, PlayCircle } from "lucide-react";
import { TopBar } from "@/components/consumer/TopBar";
import { CompanyAvatar } from "@/components/ui/CompanyAvatar";
import { Button } from "@/components/ui/Button";
import { ProductCard } from "@/components/consumer/ProductCard";
import { RewardCard } from "@/components/consumer/RewardCard";
import { AdThumb } from "@/components/consumer/AdThumb";
import { ReportBlockSheet } from "@/components/consumer/ReportBlockSheet";
import { useWallet } from "@/contexts/WalletContext";
import type { ReportReason } from "@/lib/safety";
import { useData } from "@/contexts/DataContext";
import { useConsumerAuth } from "@/contexts/ConsumerAuthContext";
import { formatNumber } from "@/lib/utils";

const tabs = ["Video's", "Producten", "Deals", "Over"] as const;

export default function CompanyProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { companies, products: allProducts, rewards: allRewards, ads } = useData();
  const company = companies.find((c) => c.id === id);
  const [tab, setTab] = useState<(typeof tabs)[number]>("Video's");
  const [safetySheetOpen, setSafetySheetOpen] = useState(false);

  const { followedCompanyIds, toggleFollow, savedProductIds, toggleSave, toggleBlock, report } = useWallet();
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
  // Nieuwste video eerst; consumenten zien via RLS toch alleen goedgekeurde.
  const videos = ads.filter((a) => a.companyId === company.id && a.moderationStatus === "approved").reverse();
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
              {formatNumber(followerCount)} volgers · {videos.length} video&apos;s · {company.category}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant={followed ? "secondary" : "primary"} onClick={() => requireAuth() && toggleFollow(company.id)}>
              {followed ? "Volgend" : "Volgen"}
            </Button>
            <button
              onClick={() => requireAuth() && setSafetySheetOpen(true)}
              aria-label="Meer opties"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5"
            >
              <MoreVertical size={16} className="text-white/70" />
            </button>
          </div>
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

        {tab === "Video's" && (
          videos.length === 0 ? (
            <p className="text-sm text-white/40">Nog geen video&apos;s van dit bedrijf.</p>
          ) : (
            <div className="grid grid-cols-3 gap-1.5">
              {videos.map((ad) => {
                const productImage = allProducts.find((p) => p.id === ad.productId)?.imageUrl;
                return (
                  <Link
                    key={ad.id}
                    href={`/app/company/${company.id}/videos?start=${ad.id}`}
                    className="relative aspect-[9/16] overflow-hidden rounded-lg border border-white/10 bg-white/[0.04]"
                  >
                    <AdThumb posterUrl={ad.posterUrl} videoUrl={ad.videoUrl} fallbackImageUrl={productImage} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    <PlayCircle size={18} className="absolute right-1.5 top-1.5 text-white/80" />
                    <p className="absolute inset-x-1.5 bottom-1.5 line-clamp-2 text-[11px] font-medium leading-tight">{ad.caption}</p>
                  </Link>
                );
              })}
            </div>
          )
        )}

        {tab === "Producten" && (
          <div className="grid grid-cols-2 gap-3">
            {products.length === 0 && <p className="text-sm text-white/40 col-span-2">Nog geen producten van dit bedrijf.</p>}
            {products.map((p) => {
              const productAd = ads.find((a) => a.productId === p.id);
              return (
                <ProductCard
                  key={p.id}
                  product={p}
                  company={company}
                  saved={savedProductIds.has(p.id)}
                  onToggleSave={() => requireAuth() && toggleSave(p.id, productAd?.id ?? null)}
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

      <ReportBlockSheet
        open={safetySheetOpen}
        onClose={() => setSafetySheetOpen(false)}
        companyName={company.name}
        onReport={(reason: ReportReason) => report("business", company.id, reason)}
        onBlock={() => toggleBlock(company.id)}
      />
    </div>
  );
}
