"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { FeedCard } from "@/components/consumer/FeedCard";
import { FeedTabs } from "@/components/consumer/FeedTabs";
import { PullToRefreshIndicator } from "@/components/consumer/PullToRefreshIndicator";
import { TokenBadge } from "@/components/ui/TokenBadge";
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

// Discover is a second swipeable feed, distinct from For You's interest
// ranking: it surfaces ads this device hasn't watched any of yet, so it
// stays a way to stumble onto something new rather than re-ranking the same
// pool. Once everything loaded so far has been seen, it falls back to the
// rest of what's been fetched (and keeps fetching more) so the feed
// doesn't run dry.
export default function DiscoverPage() {
  const adWatchProgress = useAppStore((s) => s.adWatchProgress);
  const { companies, products, loading: catalogLoading } = useData();
  const { ads, loading: adsLoading, hasMore, loadMore, refresh: refreshAds } = usePaginatedAds();
  const { blockedCompanyIds } = useWallet();
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const loading = catalogLoading || adsLoading;

  const visible = useMemo(
    () => ads.filter((a) => !blockedCompanyIds.has(a.companyId)),
    [ads, blockedCompanyIds]
  );
  const getAdId = useCallback((a: Ad) => a.id, []);
  // adWatchProgress ticks continuously while a video plays (see FeedCard's
  // playback-progress tracking) — reading it here only to decide each ad's
  // group at reshuffle time, never as a useStableFeedOrder input directly,
  // is what stops every progress tick from re-shuffling the whole feed.
  const groupKey = useCallback((a: Ad) => (adWatchProgress[a.id] ? 1 : 0), [adWatchProgress]);
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
        <p>Nog geen advertenties. Zodra een bedrijf een campagne publiceert, verschijnt die hier.</p>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* See src/app/app/page.tsx for why this header lives outside the
          scroller as a sibling instead of an absolutely-positioned child of
          it — nested inside, it scrolled away with the videos. */}
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

      {/* See src/app/app/page.tsx — absolute-centering instead of a 3-column
          grid, which squeezed "For You"/"Discover" into a column too narrow
          for the text and wrapped it onto two lines. */}
      <div className="pointer-events-none absolute top-[calc(env(safe-area-inset-top)+0.75rem)] left-0 right-0 z-30 h-7">
        <div className="pointer-events-auto absolute left-1/2 top-0 -translate-x-1/2 whitespace-nowrap">
          <FeedTabs active="discover" onActiveTap={refreshFeed} />
        </div>
        <div className="pointer-events-auto absolute right-4 top-0 flex items-center gap-2">
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
    </div>
  );
}
