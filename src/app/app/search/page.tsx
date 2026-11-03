"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search as SearchIcon, X, PlayCircle } from "lucide-react";
import { TopBar } from "@/components/consumer/TopBar";
import { ProductCard } from "@/components/consumer/ProductCard";
import { RewardCard } from "@/components/consumer/RewardCard";
import { CompanyAvatar } from "@/components/ui/CompanyAvatar";
import { AdThumb } from "@/components/consumer/AdThumb";
import { EmptyState } from "@/components/ui/EmptyState";
import { useWallet } from "@/contexts/WalletContext";
import { useConsumerAuth } from "@/contexts/ConsumerAuthContext";
import type { SearchRecord } from "@/lib/algolia";
import { idFromObjectID, searchEverything, type AdSearchRecord, type SearchOutcome } from "@/lib/searchVideos";
import { clearRecentSearches, getSuggestions, loadRecentSearches, rememberSearch, type SuggestionSource } from "@/lib/searchSuggestions";
import { useData } from "@/contexts/DataContext";
import { cn } from "@/lib/utils";
import type { Company, Product, Reward, Category, RewardCategory } from "@/types";

function hitToCompany(hit: Extract<SearchRecord, { type: "company" }>): Company {
  return {
    id: idFromObjectID(hit.objectID),
    name: hit.name,
    logoUrl: hit.logoUrl,
    bannerUrl: hit.bannerUrl,
    verified: hit.verified,
    category: hit.category as Category,
    location: hit.location,
    website: "",
    description: hit.description,
    followers: hit.followers,
  };
}

function hitToProduct(hit: Extract<SearchRecord, { type: "product" }>): Product {
  return {
    id: idFromObjectID(hit.objectID),
    companyId: hit.companyId,
    name: hit.name,
    description: hit.description,
    imageUrl: hit.imageUrl,
    price: hit.price,
    oldPrice: hit.oldPrice,
    category: hit.category as Category,
    url: hit.url ?? "",
    rating: hit.rating,
    highlights: hit.highlights,
  };
}

function hitToCompanyStub(companyId: string, name: string, logoUrl: string, verified: boolean): Company {
  // A minimal stand-in for the product/reward/ad's own company, built from
  // the fields denormalized onto that hit — not a real Company record, but
  // ProductCard/RewardCard only ever read name/logoUrl/verified from it.
  return {
    id: companyId,
    name,
    logoUrl,
    bannerUrl: "",
    verified,
    category: "Fashion",
    location: "",
    website: "",
    description: "",
    followers: 0,
  };
}

function hitToReward(hit: Extract<SearchRecord, { type: "reward" }>): Reward {
  return {
    id: idFromObjectID(hit.objectID),
    companyId: hit.companyId,
    title: hit.title,
    description: hit.description ?? "",
    imageUrl: hit.imageUrl,
    category: hit.category as RewardCategory,
    tokenCost: hit.tokenCost,
    moneyValue: hit.moneyValue,
    terms: "",
    stock: 0,
    startDate: "",
    endDate: "",
    redemptionMethod: "code",
  };
}

function VideoGrid({ hits, onOpen }: { hits: AdSearchRecord[]; onOpen: (adId: string) => void }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {hits.map((hit) => (
        <button
          key={hit.objectID}
          onClick={() => onOpen(idFromObjectID(hit.objectID))}
          className="relative aspect-[9/16] rounded-xl overflow-hidden bg-white/[0.03] border border-white/10 text-left"
        >
          <AdThumb posterUrl={hit.posterUrl} videoUrl={hit.videoUrl} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
          <PlayCircle size={26} className="absolute top-2 right-2 text-white/80" />
          <div className="absolute bottom-0 left-0 right-0 p-2.5">
            {hit.companyName && <p className="text-[11px] font-semibold text-white/70 mb-0.5">{hit.companyName}</p>}
            <p className="text-xs font-medium line-clamp-2">{hit.caption}</p>
          </div>
        </button>
      ))}
    </div>
  );
}

// De getypte letters vet, de rest gewoon: zo zie je wat er wordt aangevuld.
function Highlighted({ text, typed }: { text: string; typed: string }) {
  const t = typed.trim();
  if (t && text.toLowerCase().startsWith(t.toLowerCase())) {
    return (
      <span className="truncate">
        <b className="font-semibold">{text.slice(0, t.length)}</b>
        <span className="text-white/70">{text.slice(t.length)}</span>
      </span>
    );
  }
  return <span className="truncate text-white/70">{text}</span>;
}

type Tab = "videos" | "companies" | "products" | "rewards";

export default function SearchPage() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [inputFocused, setInputFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { savedProductIds, toggleSave } = useWallet();
  const { requireAuth } = useConsumerAuth();
  const { companies, products, ads: catalogAds, loading: catalogLoading } = useData();
  // De zoekopdracht gebruikt de nieuwste gegevens zonder bij elke verversing opnieuw te zoeken.
  const catalogRef = useRef({ ads: catalogAds, products, companies });
  useEffect(() => {
    catalogRef.current = { ads: catalogAds, products, companies };
  }, [catalogAds, products, companies]);

  const [outcome, setOutcome] = useState<SearchOutcome | null>(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<Tab>("videos");
  const [recents, setRecents] = useState<string[]>([]);

  const query = q.trim();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRecents(loadRecentSearches());
    // Terug uit het videoscherm: de zoekterm staat in het adres, zodat je weer op je resultaten komt.
    const fromUrl = new URLSearchParams(window.location.search).get("q");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (fromUrl) {
      setQ(fromUrl);
      // Je komt terug op je resultaten: geen toetsenbord ervoor.
      inputRef.current?.blur();
    }
  }, []);

  useEffect(() => {
    if (!query) {
      // Clearing the query resets to the empty state — an external reset,
      // not a value derived from this render.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOutcome(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    // Een korte vertraging: Algolia is snel, maar zo gaat er niet bij elke toetsaanslag een zoekopdracht weg.
    const timeout = window.setTimeout(async () => {
      try {
        const found = await searchEverything(query, catalogRef.current);
        if (!cancelled) setOutcome(found);
      } catch {
        if (!cancelled) setOutcome({ hits: [], ads: [], relatedAds: [] });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 150);
    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [query, catalogLoading]);

  // Bedrijven die verborgen of weg zijn (en nog in de zoekindex staan) tonen we niet.
  const companyIds = useMemo(() => new Set(companies.map((c) => c.id)), [companies]);
  const known = (companyId: string) => catalogLoading || companyIds.size === 0 || companyIds.has(companyId);

  const results = useMemo(() => {
    if (!outcome) return null;
    const hits = outcome.hits;
    const companiesFound = hits.filter((h): h is Extract<SearchRecord, { type: "company" }> => h.type === "company" && known(idFromObjectID(h.objectID)));
    const productsFound = hits.filter((h): h is Extract<SearchRecord, { type: "product" }> => h.type === "product" && known(h.companyId));
    const rewardsFound = hits.filter((h): h is Extract<SearchRecord, { type: "reward" }> => h.type === "reward" && known(h.companyId));
    const adsFound = outcome.ads.filter((h) => known(h.companyId));
    const relatedFound = outcome.relatedAds.filter((h) => known(h.companyId));
    return { companies: companiesFound, products: productsFound, rewards: rewardsFound, ads: adsFound, related: relatedFound, videos: [...adsFound, ...relatedFound] };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outcome, companyIds, catalogLoading]);

  // Bij elke nieuwe zoekopdracht beginnen we bij de video's. Zijn die er niet, dan bij het eerste
  // tabblad dat wel iets heeft.
  useEffect(() => {
    if (!outcome) return;
    const next: Tab =
      outcome.ads.length + outcome.relatedAds.length > 0
        ? "videos"
        : outcome.hits.some((h) => h.type === "company")
          ? "companies"
          : outcome.hits.some((h) => h.type === "product")
            ? "products"
            : outcome.hits.some((h) => h.type === "reward")
              ? "rewards"
              : "videos";
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTab(next);
  }, [outcome]);

  // Aanvullen: eerst wat echt in Swyp staat, dan het woordenboek en zinnen. Per letter minder en preciezer.
  const content = useMemo<SuggestionSource[]>(() => {
    const out: SuggestionSource[] = [];
    for (const c of companies) out.push({ text: c.name, kind: "bedrijf" });
    for (const p of products) out.push({ text: p.name, kind: "product" });
    if (outcome) {
      // Alleen wat de app nog echt kent: de zoekindex kan nog bedrijven bevatten die inmiddels verborgen zijn.
      for (const hit of outcome.hits) {
        if (hit.type === "company" && known(idFromObjectID(hit.objectID))) out.push({ text: hit.name, kind: "bedrijf" });
        else if (hit.type === "product" && known(hit.companyId)) out.push({ text: hit.name, kind: "product" });
      }
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companies, products, outcome, companyIds, catalogLoading]);
  const suggestions = useMemo(() => getSuggestions(q, content, 8), [q, content]);

  function submit(text: string) {
    const value = text.trim();
    if (!value) return;
    setQ(value);
    rememberSearch(value);
    setRecents(loadRecentSearches());
    inputRef.current?.blur();
  }

  function openVideo(adId: string) {
    rememberSearch(query);
    window.history.replaceState(window.history.state, "", `/app/search?q=${encodeURIComponent(query)}`);
    router.push(`/app/search/feed?q=${encodeURIComponent(query)}&ad=${encodeURIComponent(adId)}`);
  }

  const total = results ? results.videos.length + results.companies.length + results.products.length + results.rewards.length : 0;
  const noResults = results && !loading && total === 0;
  const showSuggestions = inputFocused && query.length > 0 && suggestions.length > 0;
  const showRecents = inputFocused && query.length === 0 && recents.length > 0;

  const tabs: { key: Tab; label: string; count: number }[] = results
    ? [
        { key: "videos", label: "Video's", count: results.videos.length },
        { key: "companies", label: "Bedrijven", count: results.companies.length },
        { key: "products", label: "Producten", count: results.products.length },
        { key: "rewards", label: "Rewards", count: results.rewards.length },
      ]
    : [];

  return (
    <div className="min-h-full pb-28">
      <TopBar back />
      <div className="relative px-4 -mt-1 pb-3">
        <div className="flex items-center gap-2 rounded-xl bg-white/5 border border-white/15 px-3 py-2.5">
          <SearchIcon size={18} className="text-white/40" />
          <input
            ref={inputRef}
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submit(q);
            }}
            enterKeyHint="search"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            placeholder="Zoek merken, producten, deals..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-white/30"
          />
          {q && (
            <button onMouseDown={(e) => e.preventDefault()} onClick={() => setQ("")} aria-label="Wissen">
              <X size={16} className="text-white/40" />
            </button>
          )}
        </div>

        {(showSuggestions || showRecents) && (
          <div
            data-testid="search-suggestions"
            className="absolute left-4 right-4 top-full z-20 mt-1 overflow-hidden rounded-xl border border-white/10 bg-slate shadow-xl"
          >
            {showRecents && (
              <div className="flex items-center justify-between px-3.5 pt-2.5 pb-1 text-[11px] uppercase tracking-wide text-white/40">
                <span>Recent gezocht</span>
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    clearRecentSearches();
                    setRecents([]);
                  }}
                  className="normal-case text-white/50 underline"
                >
                  Wissen
                </button>
              </div>
            )}
            {(showSuggestions ? suggestions.map((s) => ({ text: s.text, kind: s.kind })) : recents.map((r) => ({ text: r, kind: undefined }))).map((s) => (
              <button
                key={s.text}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => submit(s.text)}
                className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm hover:bg-white/5"
              >
                <SearchIcon size={14} className="shrink-0 text-white/30" />
                <Highlighted text={s.text} typed={showSuggestions ? q : ""} />
                {s.kind && <span className="ml-auto shrink-0 rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-white/40">{s.kind === "bedrijf" ? "Bedrijf" : "Product"}</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      {results && total > 0 && (
        <div className="px-4 mb-4 flex gap-2 overflow-x-auto no-scrollbar">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold",
                tab === t.key ? "border-transparent bg-white text-indigo" : "border-white/15 text-white/60"
              )}
            >
              {t.label}
              {t.key !== "videos" && t.count > 0 ? ` ${t.count}` : ""}
            </button>
          ))}
        </div>
      )}

      {noResults && (
        <EmptyState icon={SearchIcon} title={`Geen resultaten voor "${q}"`} description="Probeer een andere zoekterm." />
      )}

      {results && tab === "videos" && results.videos.length > 0 && (
        <section className="px-4 mb-6">
          <VideoGrid hits={results.videos} onOpen={openVideo} />
          {results.ads.length > 0 && results.related.length > 0 && (
            <p className="mt-3 text-center text-[11px] text-white/35">Onderaan staan video&apos;s die erbij passen.</p>
          )}
        </section>
      )}

      {results && tab === "videos" && results.videos.length === 0 && total > 0 && (
        <p className="px-4 text-sm text-white/50">Geen video&apos;s hiervoor. Kijk bij Bedrijven of Producten.</p>
      )}

      {results && tab === "companies" && results.companies.length > 0 && (
        <section className="px-4 mb-6">
          <div className="flex flex-col gap-2">
            {results.companies.map((hit) => {
              const c = hitToCompany(hit);
              return (
                <Link key={c.id} href={`/app/company/${c.id}`} className="flex items-center gap-3 rounded-xl bg-white/[0.03] border border-white/10 p-2.5">
                  <CompanyAvatar src={c.logoUrl} name={c.name} verified={c.verified} size={38} />
                  <div>
                    <p className="text-sm font-semibold">{c.name}</p>
                    <p className="text-xs text-white/40">{c.category} · {c.location}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {results && tab === "products" && results.products.length > 0 && (
        <section className="px-4 mb-6">
          <div className="grid grid-cols-2 gap-3">
            {results.products.map((hit) => {
              const product = hitToProduct(hit);
              const company = hitToCompanyStub(hit.companyId, hit.companyName, hit.companyLogoUrl, hit.companyVerified);
              const productAd = results.ads.find((a) => a.productId === product.id);
              return (
                <ProductCard
                  key={product.id}
                  product={product}
                  company={company}
                  saved={savedProductIds.has(product.id)}
                  onToggleSave={() => requireAuth() && toggleSave(product.id, productAd ? idFromObjectID(productAd.objectID) : null)}
                />
              );
            })}
          </div>
        </section>
      )}

      {results && tab === "rewards" && results.rewards.length > 0 && (
        <section className="px-4 mb-6">
          <div className="grid grid-cols-2 gap-3">
            {results.rewards.map((hit) => {
              const reward = hitToReward(hit);
              const company = hitToCompanyStub(hit.companyId, hit.companyName, hit.companyLogoUrl, false);
              return <RewardCard key={reward.id} reward={reward} company={company} />;
            })}
          </div>
        </section>
      )}
    </div>
  );
}
