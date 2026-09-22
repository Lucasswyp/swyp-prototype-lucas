"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { FeedCard } from "@/components/consumer/FeedCard";
import { FeedTabs } from "@/components/consumer/FeedTabs";
import { TokenBadge } from "@/components/ui/TokenBadge";
import { useAppStore } from "@/store/useAppStore";
import { useData } from "@/contexts/DataContext";
import { useWallet } from "@/contexts/WalletContext";

// Discover is a second swipeable feed, distinct from For You's interest
// ranking: it surfaces ads this device hasn't watched any of yet, so it
// stays a way to stumble onto something new rather than re-ranking the same
// pool. Once everything's been seen at least once, it falls back to the
// full catalog so the feed never runs dry.
export default function DiscoverPage() {
  const adWatchProgress = useAppStore((s) => s.adWatchProgress);
  const { ads, companies, products, loading } = useData();
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const orderedAds = useMemo(() => {
    const unseen = ads.filter((a) => !adWatchProgress[a.id]);
    const seen = ads.filter((a) => adWatchProgress[a.id]);
    return [...unseen, ...seen];
  }, [ads, adWatchProgress]);

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

  const { balance: tokenBalance } = useWallet();

  if (loading) {
    // The branded SwypSplash in the layout covers this — nothing to render.
    return null;
  }

  if (orderedAds.length === 0) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center text-center px-8 text-white/50 text-sm gap-2">
        <p>Nog geen advertenties. Zodra een bedrijf een campagne publiceert, verschijnt die hier.</p>
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
        <FeedTabs active="discover" />
        <div className="pointer-events-auto flex items-center gap-2">
          <Link
            href="/app/search"
            aria-label="Zoeken"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-black/35 backdrop-blur border border-white/20"
          >
            <Search size={16} />
          </Link>
          <Link href="/app/wallet">
            <TokenBadge amount={tokenBalance} size="sm" className="bg-black/35 backdrop-blur border-white/20" />
          </Link>
        </div>
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
