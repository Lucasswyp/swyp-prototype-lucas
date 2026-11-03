"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { FeedCard } from "@/components/consumer/FeedCard";
import { PullToRefreshIndicator } from "@/components/consumer/PullToRefreshIndicator";
import { TokenBadge } from "@/components/ui/TokenBadge";
import { Logo } from "@/components/ui/Logo";
import { useAppStore } from "@/store/useAppStore";
import { useData } from "@/contexts/DataContext";
import { useWallet } from "@/contexts/WalletContext";
import { usePullToRefresh } from "@/lib/usePullToRefresh";
import { useStableFeedOrder } from "@/lib/useStableFeedOrder";
import { usePaginatedAds } from "@/lib/usePaginatedAds";
import { APP_RESUME_REFRESH_MS, onAppActiveChange } from "@/lib/appVisibility";
import { clearFeedState, loadFeedState, saveFeedState } from "@/lib/feedState";
import type { Ad } from "@/types";

// Fetch the next page once the viewer is this close to the end of what's
// currently loaded — far enough ahead that the fetch (a couple hundred ms)
// finishes before they'd actually swipe past the last loaded card.
// Zodra je binnen 10 video's van het einde van wat er geladen is komt, worden de volgende opgehaald.
const LOAD_MORE_THRESHOLD = 10;
const PREFETCH_AHEAD = 5;
const NEW_VIDEOS_POLL_MS = 60_000;

export default function FeedPage() {
  const interests = useAppStore((s) => s.interests);
  const { companies, products, loading: catalogLoading, refresh: refreshCatalog } = useData();
  const { ads, loading: adsLoading, hasMore, loadMore, refresh: refreshAds, syncNewest } = usePaginatedAds();
  const { blockedCompanyIds } = useWallet();
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const loading = catalogLoading || adsLoading;
  // Was je hier net nog (minder dan een halfuur geleden)? Dan sta je straks weer op dezelfde video.
  const [saved] = useState(() => (typeof window === "undefined" ? null : loadFeedState()));

  // A blocked business's ads must never resurface no matter how the rest
  // of the feed is ranked (fetchAdsPage already only returns approved ones).
  const visible = useMemo(
    () => ads.filter((a) => !blockedCompanyIds.has(a.companyId)),
    [ads, blockedCompanyIds]
  );
  const getAdId = useCallback((a: Ad) => a.id, []);
  const groupKey = useCallback((a: Ad) => (interests.length === 0 || interests.includes(a.category) ? 0 : 1), [interests]);
  const orderedAds = useStableFeedOrder(visible, getAdId, groupKey, refreshKey, saved?.ids);

  function handleScroll() {
    const el = containerRef.current;
    if (!el) return;
    const index = Math.round(el.scrollTop / el.clientHeight);
    if (index !== activeIndex) setActiveIndex(index);
    if (hasMore && index >= orderedAds.length - LOAD_MORE_THRESHOLD) loadMore();
  }

  // Stabiel (verandert niet bij elke scroll), zodat de video-kaarten niet steeds opnieuw getekend worden.
  const orderedRef = useRef(orderedAds);
  const activeIndexRef = useRef(activeIndex);
  useEffect(() => {
    orderedRef.current = orderedAds;
    activeIndexRef.current = activeIndex;
  }, [orderedAds, activeIndex]);
  const skipAd = useCallback((adId: string) => {
    const index = orderedRef.current.findIndex((a) => a.id === adId);
    const el = containerRef.current;
    if (index !== -1 && index < orderedRef.current.length - 1 && el) {
      el.scrollTo({ top: (index + 1) * el.clientHeight, behavior: "smooth" });
    }
  }, []);

  // Terug naar de video waar je was gebleven (alleen bij het openen, en alleen binnen het halfuur).
  const restoredScrollRef = useRef(false);
  useEffect(() => {
    if (restoredScrollRef.current || !saved?.activeId || orderedAds.length === 0) return;
    restoredScrollRef.current = true;
    const index = orderedAds.findIndex((a) => a.id === saved.activeId);
    const el = containerRef.current;
    if (index > 0 && el) {
      el.scrollTo({ top: index * el.clientHeight });
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveIndex(index);
    }
  }, [orderedAds, saved]);

  // Onthoud volgorde en positie, ook voor als de telefoon de app tussendoor uit het geheugen haalt.
  useEffect(() => {
    if (orderedAds.length === 0) return;
    // Wacht met bewaren tot de oude positie is teruggezet, anders overschrijven we hem met video 1.
    if (saved?.activeId && !restoredScrollRef.current) return;
    saveFeedState(orderedAds.map((a) => a.id), orderedAds[activeIndex]?.id ?? null);
  }, [orderedAds, activeIndex, saved]);

  // Pull-down-at-top gesture: "give me a fresh feed".
  const refreshFeed = useCallback(async () => {
    await refreshAds();
    setRefreshKey((k) => k + 1);
    setActiveIndex(0);
    containerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [refreshAds]);

  const { pullDistance, refreshing, triggerDistance } = usePullToRefresh(containerRef, refreshFeed);

  // Nieuwe video's komen vanzelf binnen:
  //  - Kom je binnen een halfuur terug in de app, dan staat alles precies zoals je het achterliet;
  //    nieuwe video's komen stilletjes onderaan erbij.
  //  - Ben je langer weg geweest, dan begint de feed helemaal opnieuw met de nieuwste video's.
  //  - Blijft de app open, dan komen nieuwe video's elke minuut stilletjes onderaan erbij.
  useEffect(() => {
    let hiddenAt: number | null = null;
    const stop = onAppActiveChange((active) => {
      if (!active) {
        hiddenAt = Date.now();
        // Tijdstip van weggaan bewaren, voor het geval de app tussendoor uit het geheugen gaat.
        const list = orderedRef.current;
        if (list.length > 0) saveFeedState(list.map((a) => a.id), list[activeIndexRef.current]?.id ?? null);
        return;
      }
      const away = hiddenAt ? Date.now() - hiddenAt : 0;
      hiddenAt = null;
      if (away >= APP_RESUME_REFRESH_MS) {
        clearFeedState();
        refreshCatalog();
        void syncNewest().then(() => {
          setRefreshKey((k) => k + 1);
          setActiveIndex(0);
          containerRef.current?.scrollTo({ top: 0 });
        });
      } else if (away > 5_000) {
        refreshCatalog();
        void syncNewest();
      }
    });
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        refreshCatalog();
        void syncNewest();
      }
    }, NEW_VIDEOS_POLL_MS);
    return () => {
      stop();
      window.clearInterval(timer);
    };
  }, [syncNewest, refreshCatalog]);

  const { balance: tokenBalance } = useWallet();

  if (loading) {
    // The loading cover in the layout covers this — nothing to render.
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
                // Een reeks video's staat alvast klaar: de volgende twee ruim, de drie daarna en de
                // vorige alleen de eerste paar seconden. Zo hoef je bij het scrollen nergens op te wachten.
                isNear={i !== activeIndex && i - activeIndex >= -1 && i - activeIndex <= PREFETCH_AHEAD}
                prefetch={i - activeIndex >= 1 && i - activeIndex <= 2 ? "full" : "light"}
                onSkip={skipAd}
              />
            </div>
          );
        })}
      </div>

      <PullToRefreshIndicator pullDistance={pullDistance} refreshing={refreshing} triggerDistance={triggerDistance} />

      <div className="pointer-events-none absolute top-[calc(env(safe-area-inset-top)+0.75rem)] left-0 right-0 z-30 h-7">
        <Link href="/app/wallet" className="pointer-events-auto absolute right-4 top-0">
          <TokenBadge amount={tokenBalance} size="sm" className="bg-black/35 backdrop-blur border-white/20" />
        </Link>
      </div>
    </div>
  );
}
