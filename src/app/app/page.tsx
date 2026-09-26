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
import { useStableFeedOrder } from "@/lib/useStableFeedOrder";
import { usePaginatedAds } from "@/lib/usePaginatedAds";
import type { Ad } from "@/types";

// Fetch the next page once the viewer is this close to the end of what's
// currently loaded — far enough ahead that the fetch (a couple hundred ms)
// finishes before they'd actually swipe past the last loaded card.
const LOAD_MORE_THRESHOLD = 5;

export default function FeedPage() {
  const interests = useAppStore((s) => s.interests);
  const { companies, products, loading: catalogLoading } = useData();
  const { ads, loading: adsLoading, hasMore, loadMore, refresh: refreshAds } = usePaginatedAds();
  const { blockedCompanyIds } = useWallet();
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const loading = catalogLoading || adsLoading;

  // A blocked business's ads must never resurface no matter how the rest
  // of the feed is ranked (fetchAdsPage already only returns approved ones).
  const visible = useMemo(
    () => ads.filter((a) => !blockedCompanyIds.has(a.companyId)),
    [ads, blockedCompanyIds]
  );
  const getAdId = useCallback((a: Ad) => a.id, []);
  const groupKey = useCallback((a: Ad) => (interests.length === 0 || interests.includes(a.category) ? 0 : 1), [interests]);
  const orderedAds = useStableFeedOrder(visible, getAdId, groupKey, refreshKey);

  function handleScroll() {
    const el = containerRef.current;
    if (!el) return;
    const index = Math.round(el.scrollTop / el.clientHeight);
    if (index !== activeIndex) setActiveIndex(index);
    if (hasMore && index >= orderedAds.length - LOAD_MORE_THRESHOLD) loadMore();
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
    await refreshAds();
    setRefreshKey((k) => k + 1);
    setActiveIndex(0);
    containerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [refreshAds]);

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

      {/* Centering this with a 3-column grid (each column an equal 1/3 of the
          width) squeezed "For You" + "Discover" into a column too narrow for
          both words side by side, wrapping "For You" onto two lines. Free-
          floating absolute positioning instead lets the tab group be exactly
          as wide as its content while still landing dead-center. */}
      <div className="pointer-events-none absolute top-[calc(env(safe-area-inset-top)+0.75rem)] left-0 right-0 z-30 h-7">
        <div className="pointer-events-auto absolute left-1/2 top-0 -translate-x-1/2 whitespace-nowrap">
          <FeedTabs active="for-you" onActiveTap={refreshFeed} />
        </div>
        <Link href="/app/wallet" className="pointer-events-auto absolute right-4 top-0">
          <TokenBadge amount={tokenBalance} size="sm" className="bg-black/35 backdrop-blur border-white/20" />
        </Link>
      </div>
    </div>
  );
}
