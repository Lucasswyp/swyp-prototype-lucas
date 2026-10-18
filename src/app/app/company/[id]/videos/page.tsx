"use client";

import { Suspense, use, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { FeedCard } from "@/components/consumer/FeedCard";
import { useData } from "@/contexts/DataContext";

// Alle video's van één bedrijf onder elkaar, net als de hoofdfeed: omhoog
// vegen gaat naar de volgende video van dit bedrijf. Het bedrijfsprofiel
// opent hier op de video waarop is getikt (?start=<adId>).
function CompanyVideos({ companyId }: { companyId: string }) {
  const { companies, products, ads } = useData();
  const startId = useSearchParams().get("start");
  const containerRef = useRef<HTMLDivElement>(null);

  const company = companies.find((c) => c.id === companyId);
  const videos = useMemo(
    () => ads.filter((a) => a.companyId === companyId && a.moderationStatus === "approved").reverse(),
    [ads, companyId]
  );
  const startIndex = Math.max(0, videos.findIndex((a) => a.id === startId));
  const [activeIndex, setActiveIndex] = useState(startIndex);
  const positioned = useRef(false);

  // Springt één keer naar de aangetikte video zodra de lijst er is.
  useEffect(() => {
    const el = containerRef.current;
    if (!el || positioned.current || videos.length === 0) return;
    positioned.current = true;
    el.scrollTo({ top: startIndex * el.clientHeight });
    setActiveIndex(startIndex);
  }, [videos.length, startIndex]);

  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el || el.clientHeight === 0) return;
    setActiveIndex(Math.round(el.scrollTop / el.clientHeight));
  }, []);

  function skip(index: number) {
    const el = containerRef.current;
    if (!el || index >= videos.length - 1) return;
    el.scrollTo({ top: (index + 1) * el.clientHeight, behavior: "smooth" });
  }

  if (!company) {
    return <p className="p-6 text-sm text-white/50">Bedrijf niet gevonden.</p>;
  }

  return (
    <div className="relative h-full w-full overflow-hidden">
      {videos.length === 0 ? (
        <div className="flex h-full w-full items-center justify-center px-8 text-center text-sm text-white/50">
          {company.name} heeft nog geen video&apos;s.
        </div>
      ) : (
        <div
          ref={containerRef}
          onScroll={handleScroll}
          className="absolute inset-0 overflow-y-scroll snap-y snap-mandatory no-scrollbar"
        >
          {videos.map((ad, i) => {
            const product = products.find((p) => p.id === ad.productId);
            if (!product) return null;
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
      )}

      <Link
        href={`/app/company/${companyId}`}
        aria-label="Terug naar profiel"
        className="absolute left-3 top-[calc(env(safe-area-inset-top)+0.75rem)] z-30 flex items-center gap-1 rounded-full bg-black/40 py-1.5 pl-2 pr-3 text-sm font-medium backdrop-blur"
      >
        <ChevronLeft size={18} />
        {company.name}
      </Link>
    </div>
  );
}

export default function CompanyVideosPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <Suspense fallback={null}>
      <CompanyVideos companyId={id} />
    </Suspense>
  );
}
