"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, Search as SearchIcon } from "lucide-react";
import { FeedCard } from "@/components/consumer/FeedCard";
import { TokenBadge } from "@/components/ui/TokenBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { useData } from "@/contexts/DataContext";
import { useWallet } from "@/contexts/WalletContext";
import { fetchAdsByIds } from "@/lib/data";
import { idFromObjectID, searchEverything } from "@/lib/searchVideos";
import type { Ad } from "@/types";

const PREFETCH_AHEAD = 5;

// De video's bij een zoekopdracht, schermvullend en swipend zoals de hoofdfeed (en zoals TikTok).
// Je komt hier vanuit het raster op de zoekpagina en begint bij de video die je aantikte.
function SearchFeed() {
  const router = useRouter();
  const params = useSearchParams();
  const query = (params.get("q") ?? "").trim();
  const startId = params.get("ad");
  const { companies, products, ads: catalogAds, loading: catalogLoading } = useData();
  const catalogRef = useRef({ ads: catalogAds, products, companies });
  useEffect(() => {
    catalogRef.current = { ads: catalogAds, products, companies };
  }, [catalogAds, products, companies]);
  const { balance: tokenBalance } = useWallet();

  const [ads, setAds] = useState<Ad[] | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const positionedRef = useRef(false);

  useEffect(() => {
    if (!query) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAds([]);
      return;
    }
    if (catalogLoading) return;
    let cancelled = false;
    (async () => {
      try {
        const found = await searchEverything(query, catalogRef.current);
        const ids = [...found.ads, ...found.relatedAds].map((h) => idFromObjectID(h.objectID));
        // De aangetikte video altijd erbij, ook als die in een ander zoekresultaat zat.
        if (startId && !ids.includes(startId)) ids.unshift(startId);
        const list = await fetchAdsByIds(ids);
        if (!cancelled) setAds(list);
      } catch {
        if (!cancelled) setAds([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [query, startId, catalogLoading]);

  // Alleen video's waarvan bedrijf en product bekend zijn (verborgen bedrijven vallen af).
  const list = useMemo(() => {
    if (!ads) return null;
    if (catalogLoading) return null;
    return ads.filter((a) => companies.some((c) => c.id === a.companyId) && products.some((p) => p.id === a.productId));
  }, [ads, companies, products, catalogLoading]);

  // Begin bij de video die je aantikte.
  useEffect(() => {
    if (positionedRef.current || !list || list.length === 0) return;
    positionedRef.current = true;
    const index = startId ? list.findIndex((a) => a.id === startId) : 0;
    const el = containerRef.current;
    if (index > 0 && el) {
      el.scrollTo({ top: index * el.clientHeight });
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveIndex(index);
    }
  }, [list, startId]);

  function handleScroll() {
    const el = containerRef.current;
    if (!el) return;
    const index = Math.round(el.scrollTop / el.clientHeight);
    if (index !== activeIndex) setActiveIndex(index);
  }

  const orderedRef = useRef<Ad[]>([]);
  useEffect(() => {
    orderedRef.current = list ?? [];
  }, [list]);
  const skipAd = useCallback((adId: string) => {
    const index = orderedRef.current.findIndex((a) => a.id === adId);
    const el = containerRef.current;
    if (index !== -1 && index < orderedRef.current.length - 1 && el) {
      el.scrollTo({ top: (index + 1) * el.clientHeight, behavior: "smooth" });
    }
  }, []);

  function goBack() {
    if (window.history.length > 1) router.back();
    else router.push(`/app/search`);
  }

  if (list === null) {
    return <div className="flex h-full items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" /></div>;
  }

  if (list.length === 0) {
    return (
      <div className="h-full">
        <EmptyState icon={SearchIcon} title={`Geen video's voor "${query}"`} description="Probeer een andere zoekterm." />
        <div className="flex justify-center"><Button onClick={goBack}>Terug naar zoeken</Button></div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden">
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="absolute inset-0 overflow-y-scroll snap-y snap-mandatory no-scrollbar"
      >
        {list.map((ad, i) => {
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
                isNear={i !== activeIndex && i - activeIndex >= -1 && i - activeIndex <= PREFETCH_AHEAD}
                prefetch={i - activeIndex >= 1 && i - activeIndex <= 2 ? "full" : "light"}
                onSkip={skipAd}
              />
            </div>
          );
        })}
      </div>

      <div className="pointer-events-none absolute top-[calc(env(safe-area-inset-top)+0.75rem)] left-0 right-0 z-30 flex items-center justify-between px-3">
        <button
          onClick={goBack}
          aria-label="Terug naar zoekresultaten"
          className="pointer-events-auto flex max-w-[60%] items-center gap-1 rounded-full border border-white/20 bg-black/35 py-1.5 pl-2 pr-3 text-sm font-semibold backdrop-blur"
        >
          <ChevronLeft size={18} />
          <span className="truncate">{query}</span>
        </button>
        <Link href="/app/wallet" className="pointer-events-auto">
          <TokenBadge amount={tokenBalance} size="sm" className="bg-black/35 backdrop-blur border-white/20" />
        </Link>
      </div>
    </div>
  );
}

export default function SearchFeedPage() {
  return (
    <Suspense fallback={null}>
      <SearchFeed />
    </Suspense>
  );
}
