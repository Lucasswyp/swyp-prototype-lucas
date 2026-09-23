"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { FeedCard } from "@/components/consumer/FeedCard";
import { FeedTabs } from "@/components/consumer/FeedTabs";
import { PullToRefreshIndicator } from "@/components/consumer/PullToRefreshIndicator";
import { TokenBadge } from "@/components/ui/TokenBadge";
import { Logo } from "@/components/ui/Logo";
import { useAppStore } from "@/store/useAppStore";
import { useData } from "@/contexts/DataContext";
import { useWallet } from "@/contexts/WalletContext";
import { usePullToRefresh } from "@/lib/usePullToRefresh";
import { shuffle } from "@/lib/shuffle";

export default function FeedPage() {
  const interests = useAppStore((s) => s.interests);
  const { ads, companies, products, loading, refresh } = useData();
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);

  const orderedAds = useMemo(() => {
    if (interests.length === 0) return shuffle(ads);
    const matching = ads.filter((a) => interests.includes(a.category));
    const rest = ads.filter((a) => !interests.includes(a.category));
    return [...shuffle(matching), ...shuffle(rest)];
    // refreshKey isn't read in the body — it's the trigger to reshuffle on
    // every pull-to-refresh / tap-active-tab, since the ad data itself often
    // comes back unchanged from the DB and would otherwise look like nothing happened.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interests, ads, refreshKey]);

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

  // Shared by the pull-down-at-top gesture and tapping the already-active
  // "For You" tab — matching TikTok/Instagram, both are the same "give me a
  // fresh feed" action, just triggered two different ways.
  const refreshFeed = useCallback(async () => {
    refresh();
    setRefreshKey((k) => k + 1);
    setActiveIndex(0);
    containerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    await new Promise((r) => setTimeout(r, 500));
  }, [refresh]);

  const { pullDistance, refreshing, triggerDistance } = usePullToRefresh(containerRef, refreshFeed);

  const { balance: tokenBalance } = useWallet();

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
    <div className="relative h-full w-full overflow-hidden">
      {/* A sibling of the scroller, not a child of it — position: absolute only
          decouples an element from normal layout flow, not from its containing
          block's scroll offset. Nested inside the (position: relative) scroll
          container, this header used to scroll away with the videos exactly
          like they did. Anchoring it to this outer, non-scrolling wrapper
          instead keeps it visually fixed regardless of swipe position. */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="absolute inset-0 overflow-y-scroll snap-y snap-mandatory no-scrollbar"
      >
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

      <PullToRefreshIndicator pullDistance={pullDistance} refreshing={refreshing} triggerDistance={triggerDistance} />

      <div className="pointer-events-none absolute top-[calc(env(safe-area-inset-top)+0.75rem)] left-0 right-0 z-30 grid grid-cols-3 items-center px-4">
        <div />
        <div className="flex justify-center">
          <FeedTabs active="for-you" onActiveTap={refreshFeed} />
        </div>
        <Link href="/app/wallet" className="pointer-events-auto justify-self-end">
          <TokenBadge amount={tokenBalance} size="sm" className="bg-black/35 backdrop-blur border-white/20" />
        </Link>
      </div>
    </div>
  );
}
