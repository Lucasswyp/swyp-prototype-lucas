import { createAlgoliaSearchClient, SEARCH_INDEX_NAME, type SearchRecord } from "@/lib/algolia";
import { getRelatedTerms, normalizeSearchText } from "@/lib/relatedTerms";
import type { Ad, Company, Product } from "@/types";

export type AdSearchRecord = Extract<SearchRecord, { type: "ad" }>;

export interface SearchOutcome {
  /** Alles wat bij de zoekterm hoort: bedrijven, producten, rewards en video's. */
  hits: SearchRecord[];
  /** Video's die letterlijk bij de zoekterm passen. */
  ads: AdSearchRecord[];
  /** Video's die niet letterlijk passen maar wel bij wat ermee samenhangt (zoek op "adidas": ook sneakers). */
  relatedAds: AdSearchRecord[];
}

// Wat de app al in het geheugen heeft. De zoekindex (Algolia) wordt maar één keer per dag bijgewerkt;
// door ook hierin te zoeken zijn nieuwe video's meteen vindbaar.
export interface LocalCatalog {
  ads: Ad[];
  products: Product[];
  companies: Company[];
}

export function idFromObjectID(objectID: string) {
  // "ad-<uuid>" -> "<uuid>": het voorvoegsel zorgt er alleen voor dat de ids uniek zijn in één index.
  return objectID.slice(objectID.indexOf("-") + 1);
}

// Eén plek voor het zoeken, zodat het resultatenraster en het scherm met swipen (zoals bij TikTok)
// precies dezelfde video's in dezelfde volgorde laten zien.
function localMatches(query: string, relatedTerms: string[], catalog: LocalCatalog): { exact: AdSearchRecord[]; related: AdSearchRecord[] } {
  const normalized = normalizeSearchText(query);
  // Eén letter is te vaag om zelf in de video's te zoeken.
  if (normalized.length < 2) return { exact: [], related: [] };
  const tokens = normalized.split(" ").filter(Boolean);
  const companyById = new Map(catalog.companies.map((c) => [c.id, c]));
  const productById = new Map(catalog.products.map((p) => [p.id, p]));
  const relatedNorm = relatedTerms.map(normalizeSearchText).filter(Boolean);
  const exact: AdSearchRecord[] = [];
  const related: AdSearchRecord[] = [];

  for (const ad of catalog.ads) {
    if (ad.moderationStatus !== "approved") continue;
    const company = companyById.get(ad.companyId);
    const product = productById.get(ad.productId);
    if (!company || !product) continue;
    const hay = normalizeSearchText(`${ad.caption} ${product.name} ${product.description} ${company.name} ${ad.category} ${product.category}`);
    const words = hay.split(" ");
    // Elk getypt woord moet ergens beginnen, of (vanaf 3 letters) ergens in voorkomen.
    const matches = tokens.every((t) => words.some((w) => w.startsWith(t)) || (t.length >= 3 && hay.includes(t)));
    const record: AdSearchRecord = {
      objectID: `ad-${ad.id}`,
      type: "ad",
      caption: ad.caption,
      category: ad.category,
      videoUrl: ad.videoUrl,
      posterUrl: ad.posterUrl,
      ctaLabel: ad.ctaLabel,
      ctaColor: ad.ctaColor,
      productId: ad.productId,
      companyId: ad.companyId,
      companyName: company.name,
      companyLogoUrl: company.logoUrl,
      companyVerified: company.verified,
    };
    if (matches) exact.push(record);
    else if (relatedNorm.some((r) => words.includes(r) || hay.includes(` ${r} `))) related.push(record);
  }
  return { exact, related };
}

export async function searchEverything(query: string, catalog?: LocalCatalog): Promise<SearchOutcome> {
  const client = createAlgoliaSearchClient();
  const found = getRelatedTerms(query);
  // De categorie van de groep telt ook mee: video's hebben een categorie.
  const relatedTerms = [...found.categories.map((c) => c.toLowerCase()), ...found.terms];

  const [main, extra] = await Promise.all([
    client.searchSingleIndex<SearchRecord>({
      indexName: SEARCH_INDEX_NAME,
      searchParams: { query, hitsPerPage: 40 },
    }),
    relatedTerms.length > 0
      ? client
          .searchSingleIndex<SearchRecord>({
            indexName: SEARCH_INDEX_NAME,
            searchParams: {
              query: relatedTerms.join(" "),
              filters: "type:ad",
              // Alle woorden zijn optioneel: een video hoeft maar bij één verwant woord te passen.
              optionalWords: relatedTerms,
              removeWordsIfNoResults: "allOptional",
              typoTolerance: false,
              hitsPerPage: 20,
            },
          })
          .catch(() => null)
      : Promise.resolve(null),
  ]);

  const isAd = (h: SearchRecord): h is AdSearchRecord => h.type === "ad";
  const ads = main.hits.filter(isAd);
  const mainIds = new Set(main.hits.map((h) => h.objectID));
  const relatedAds = (extra?.hits ?? []).filter((h): h is AdSearchRecord => isAd(h) && !mainIds.has(h.objectID));

  if (catalog) {
    const local = localMatches(query, relatedTerms, catalog);
    const have = new Set([...ads, ...relatedAds].map((a) => a.objectID));
    // Eigen zoekresultaten die de index nog niet kent komen erbij; wat al in de index zit blijft zoals het was.
    for (const rec of local.exact) if (!have.has(rec.objectID)) { ads.push(rec); have.add(rec.objectID); }
    for (const rec of local.related) if (!have.has(rec.objectID)) { relatedAds.push(rec); have.add(rec.objectID); }
  }
  return { hits: main.hits, ads, relatedAds };
}
