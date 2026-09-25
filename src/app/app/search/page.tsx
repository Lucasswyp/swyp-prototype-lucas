"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Search as SearchIcon, X, PlayCircle } from "lucide-react";
import { TopBar } from "@/components/consumer/TopBar";
import { ProductCard } from "@/components/consumer/ProductCard";
import { RewardCard } from "@/components/consumer/RewardCard";
import { CompanyAvatar } from "@/components/ui/CompanyAvatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { useWallet } from "@/contexts/WalletContext";
import { useConsumerAuth } from "@/contexts/ConsumerAuthContext";
import { createAlgoliaSearchClient, SEARCH_INDEX_NAME, type SearchRecord } from "@/lib/algolia";
import type { Company, Product, Reward, Category, RewardCategory } from "@/types";

interface AdHit {
  id: string;
  productId: string;
  companyId: string;
  companyName: string;
  companyLogoUrl: string;
  posterUrl: string;
  caption: string;
}

function idFromObjectID(objectID: string) {
  // "product-<uuid>" -> "<uuid>" — the type prefix is only there to keep
  // objectIDs unique across a combined index, not part of the real id.
  return objectID.slice(objectID.indexOf("-") + 1);
}

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

export default function SearchPage() {
  const [q, setQ] = useState("");
  const [inputFocused, setInputFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { savedProductIds, toggleSave } = useWallet();
  const { requireAuth } = useConsumerAuth();

  const [hits, setHits] = useState<SearchRecord[] | null>(null);
  const [loading, setLoading] = useState(false);

  const query = q.trim();

  useEffect(() => {
    if (!query) {
      // Clearing the query resets to the empty state — an external reset,
      // not a value derived from this render.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setHits(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const client = createAlgoliaSearchClient();
    const timeout = window.setTimeout(async () => {
      try {
        const { hits: results } = await client.searchSingleIndex<SearchRecord>({
          indexName: SEARCH_INDEX_NAME,
          searchParams: { query, hitsPerPage: 40 },
        });
        if (!cancelled) setHits(results);
      } catch {
        if (!cancelled) setHits([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
      // A short debounce — Algolia is fast, but this avoids firing a search
      // request on every single keystroke while someone's still typing.
    }, 150);
    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [query]);

  const results = useMemo(() => {
    if (!hits) return null;
    const companies = hits.filter((h): h is Extract<SearchRecord, { type: "company" }> => h.type === "company");
    const products = hits.filter((h): h is Extract<SearchRecord, { type: "product" }> => h.type === "product");
    const rewards = hits.filter((h): h is Extract<SearchRecord, { type: "reward" }> => h.type === "reward");
    const ads = hits.filter((h): h is Extract<SearchRecord, { type: "ad" }> => h.type === "ad");
    return { companies, products, rewards, ads };
  }, [hits]);

  // Google-style autocomplete, sourced from the same query's hits instead of
  // a second Algolia call — each hit's primary display field, deduped.
  const suggestions = useMemo(() => {
    if (!hits) return [];
    const seen = new Set<string>();
    const out: string[] = [];
    for (const hit of hits) {
      const label = hit.type === "product" ? hit.name : hit.type === "reward" ? hit.title : hit.type === "ad" ? hit.companyName : hit.name;
      if (!label) continue;
      const key = label.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        out.push(label);
      }
      if (out.length >= 6) break;
    }
    return out;
  }, [hits]);

  function pickSuggestion(s: string) {
    setQ(s);
    inputRef.current?.blur();
  }

  const noResults =
    results &&
    !loading &&
    results.companies.length === 0 &&
    results.products.length === 0 &&
    results.rewards.length === 0 &&
    results.ads.length === 0;

  return (
    <div className="min-h-full pb-28">
      <TopBar back />
      <div className="relative px-4 -mt-1 pb-4">
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
              if (e.key === "Enter") inputRef.current?.blur();
            }}
            placeholder="Zoek merken, producten, deals..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-white/30"
          />
          {q && (
            <button onMouseDown={(e) => e.preventDefault()} onClick={() => setQ("")} aria-label="Wissen">
              <X size={16} className="text-white/40" />
            </button>
          )}
        </div>

        {inputFocused && suggestions.length > 0 && (
          <div className="absolute left-4 right-4 top-full z-20 mt-1 overflow-hidden rounded-xl border border-white/10 bg-slate shadow-xl">
            {suggestions.map((s) => (
              <button
                key={s}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pickSuggestion(s)}
                className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm hover:bg-white/5"
              >
                <SearchIcon size={14} className="shrink-0 text-white/30" />
                <span className="truncate">{s}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {noResults && (
        <EmptyState
          icon={SearchIcon}
          title={`Geen resultaten voor "${q}"`}
          description="Probeer een andere zoekterm."
        />
      )}

      {results && results.ads.length > 0 && (
        <section className="px-4 mb-6">
          <h2 className="font-heading font-bold text-sm mb-2 text-white/50 uppercase tracking-wide">Video&apos;s</h2>
          <div className="grid grid-cols-2 gap-3">
            {results.ads.map((hit) => {
              const ad: AdHit = {
                id: idFromObjectID(hit.objectID),
                productId: hit.productId,
                companyId: hit.companyId,
                companyName: hit.companyName,
                companyLogoUrl: hit.companyLogoUrl,
                posterUrl: hit.posterUrl,
                caption: hit.caption,
              };
              return (
                <Link
                  key={ad.id}
                  href={`/app/product/${ad.productId}`}
                  className="relative aspect-[9/16] rounded-xl overflow-hidden bg-white/[0.03] border border-white/10"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={ad.posterUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
                  <PlayCircle size={26} className="absolute top-2 right-2 text-white/80" />
                  <div className="absolute bottom-0 left-0 right-0 p-2.5">
                    {ad.companyName && <p className="text-[11px] font-semibold text-white/70 mb-0.5">{ad.companyName}</p>}
                    <p className="text-xs font-medium line-clamp-2">{ad.caption}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {results && results.companies.length > 0 && (
        <section className="px-4 mb-6">
          <h2 className="font-heading font-bold text-sm mb-2 text-white/50 uppercase tracking-wide">Bedrijven</h2>
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

      {results && results.products.length > 0 && (
        <section className="px-4 mb-6">
          <h2 className="font-heading font-bold text-sm mb-2 text-white/50 uppercase tracking-wide">Producten</h2>
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

      {results && results.rewards.length > 0 && (
        <section className="px-4 mb-6">
          <h2 className="font-heading font-bold text-sm mb-2 text-white/50 uppercase tracking-wide">Rewards</h2>
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
