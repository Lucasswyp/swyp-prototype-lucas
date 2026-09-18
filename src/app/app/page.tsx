"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { FeedCard } from "@/components/consumer/FeedCard";
import { FeedTabs } from "@/components/consumer/FeedTabs";
import { TokenBadge } from "@/components/ui/TokenBadge";
import { Logo } from "@/components/ui/Logo";
import { useAppStore } from "@/store/useAppStore";
import { useData } from "@/contexts/DataContext";

export default function FeedPage() {
  const interests = useAppStore((s) => s.interests);
  const { ads, companies, products, loading } = useData();
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const orderedAds = useMemo(() => {
    if (interests.length === 0) return ads;
    const matching = ads.filter((a) => interests.includes(a.category));
    const rest = ads.filter((a) => !interests.includes(a.category));
    return [...matching, ...rest];
  }, [interests, ads]);

  function handleScroll() {
    const el = containerRef.current;
    if (!el) return;
    const index = Math.round(el.scrollTop / el.clientHeight);
    if (index !== activeIndex) setActiveIndex(index);
  }

  function scrollToIndex(index: number) {
    const el = containerRef.current;
    if (!el) return;
    el.scrollTo({ top: index * el.clientHeight, behavior: "smooth" });
  }

  function skip(index: number) {
    if (index < orderedAds.length - 1) {
      scrollToIndex(index + 1);
    }
  }

  const tokenBalance = useAppStore((s) => s.tokenBalance);

  if (loading) {
    // The branded SwypSplash in the layout covers this — nothing to render.
    return null;
  }

  if (orderedAds.length === 0) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center text-center px-8 text-white/50 text-sm gap-2">
        <Logo size="md" />
        <p className="mt-4">Nog geen advertenties. Zodra een bedrijf een campagne publiceert, verschijnt die hier.</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="relative h-full w-full overflow-y-scroll snap-y snap-mandatory no-scrollbar"
    >
      <div className="pointer-events-none absolute top-[calc(env(safe-area-inset-top)+0.75rem)] left-0 right-0 z-30 flex items-center justify-between px-4">
        <FeedTabs active="for-you" />
        <Link href="/app/wallet" className="pointer-events-auto">
          <TokenBadge amount={tokenBalance} size="sm" className="bg-black/35 backdrop-blur border-white/20" />
        </Link>
      </div>
      {orderedAds.map((ad, i) => {
        const company = companies.find((c) => c.id === ad.companyId);
        const product = products.find((p) => p.id === ad.productId);
        if (!company || !product) return null;
        return (
          <div key={ad.id} className="h-full w-full snap-start">
            <FeedCard
              ad={ad}
              company={company}
              product={product}
              isActive={i === activeIndex}
              isNear={Math.abs(i - activeIndex) === 1}
              onSkip={() => skip(i)}
            />
          </div>
        );
      })}
    </div>
  );
}
