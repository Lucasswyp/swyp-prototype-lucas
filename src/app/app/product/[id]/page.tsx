"use client";

import { use, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Star, Bookmark, Share2 } from "lucide-react";
import { TopBar } from "@/components/consumer/TopBar";
import { CompanyAvatar } from "@/components/ui/CompanyAvatar";
import { Button } from "@/components/ui/Button";
import { TokenBadge } from "@/components/ui/TokenBadge";
import { formatEuro } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";
import { useData } from "@/contexts/DataContext";
import { logInteraction } from "@/lib/data";
import { getDeviceId } from "@/lib/deviceId";
import { useConsumerAuth } from "@/contexts/ConsumerAuthContext";

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { products, companies, ads } = useData();
  const product = products.find((p) => p.id === id);
  const company = product ? companies.find((c) => c.id === product.companyId) : undefined;

  const saved = useAppStore((s) => !!s.savedProductIds[id]);
  const toggleSave = useAppStore((s) => s.toggleSave);
  const followed = useAppStore((s) => (company ? !!s.followedCompanyIds[company.id] : false));
  const toggleFollow = useAppStore((s) => s.toggleFollow);
  const viewProduct = useAppStore((s) => s.viewProduct);
  const { requireAuth, isLoggedIn } = useConsumerAuth();

  useEffect(() => {
    if (product && isLoggedIn) viewProduct(product.id, 3);
  }, [product, isLoggedIn, viewProduct]);

  if (!product || !company) {
    return (
      <div className="p-6">
        <TopBar back />
        <p className="text-white/50 text-sm">Product niet gevonden.</p>
      </div>
    );
  }

  const ad = ads.find((a) => a.companyId === company.id && a.productId === product.id);

  function handleShopClick() {
    logInteraction({ deviceId: getDeviceId(), businessId: company!.id, adId: ad?.id, productId: product!.id, eventName: "click" });
  }

  return (
    <div className="min-h-full pb-32">
      <TopBar back transparent />

      <div className="relative -mt-14 w-full aspect-square">
        <Image src={product.imageUrl} alt={product.name} fill className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-indigo via-transparent to-transparent" />
      </div>

      <div className="px-4 -mt-6 relative">
        <Link href={`/app/company/${company.id}`} className="flex items-center gap-2 mb-3 w-fit">
          <CompanyAvatar src={company.logoUrl} name={company.name} verified={company.verified} size={28} />
          <span className="text-sm font-medium text-white/70">{company.name}</span>
        </Link>

        <h1 className="font-heading text-xl font-bold mb-2">{product.name}</h1>

        <div className="flex items-center gap-2 mb-3">
          <span className="flex items-center gap-1 text-sm">
            <Star size={14} className="fill-yellow-400 text-yellow-400" /> {product.rating}
          </span>
          <span className="text-white/20">·</span>
          <span className="text-xs text-white/40">{product.category}</span>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <span className="font-heading text-2xl font-extrabold">{formatEuro(product.price)}</span>
          {product.oldPrice && (
            <>
              <span className="text-sm text-white/40 line-through">{formatEuro(product.oldPrice)}</span>
              <span className="rounded-full bg-magenta/20 text-magenta text-xs font-bold px-2 py-0.5">
                -{Math.round((1 - product.price / product.oldPrice) * 100)}%
              </span>
            </>
          )}
        </div>

        <p className="text-sm text-white/60 leading-relaxed mb-4">{product.description}</p>

        <div className="flex flex-col gap-2 mb-5">
          {product.highlights.map((h) => (
            <div key={h} className="flex items-center gap-2 text-sm text-white/70">
              <span className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-violet to-magenta shrink-0" />
              {h}
            </div>
          ))}
        </div>

        {isLoggedIn && (
          <div className="rounded-xl bg-white/[0.04] border border-white/10 p-3.5 mb-5 flex items-center gap-2">
            <TokenBadge amount={3} size="sm" />
            <span className="text-xs text-white/50">Tokens verdiend voor het bekijken van dit product</span>
          </div>
        )}

        {ad && (
          <div className="flex gap-2 mb-4">
            <Button
              variant="secondary"
              size="md"
              onClick={() => requireAuth() && toggleSave(product.id, ad.id, ad.rewardRules.save)}
              className="gap-1.5"
            >
              <Bookmark size={16} className={saved ? "fill-white" : ""} />
              {saved ? "Opgeslagen" : "Opslaan"}
            </Button>
            <Button variant="secondary" size="md" className="gap-1.5">
              <Share2 size={16} /> Delen
            </Button>
            <Button variant="secondary" size="md" onClick={() => requireAuth() && toggleFollow(company.id)}>
              {followed ? "Volgend" : "Volg bedrijf"}
            </Button>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 sm:absolute px-4 pb-6 pt-4 bg-gradient-to-t from-indigo via-indigo to-transparent">
        <a href={product.url} target="_blank" rel="noopener noreferrer" onClick={handleShopClick}>
          <Button fullWidth size="lg">
            Bekijk bij aanbieder →
          </Button>
        </a>
      </div>
    </div>
  );
}
