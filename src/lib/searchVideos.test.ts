import { describe, expect, it, vi } from "vitest";

// De zoekindex (Algolia) is hier leeg; we testen het zoeken in de eigen gegevens van de app.
vi.mock("@/lib/algolia", () => ({
  SEARCH_INDEX_NAME: "test",
  createAlgoliaSearchClient: () => ({ searchSingleIndex: async () => ({ hits: [] }) }),
}));

import { searchEverything, type LocalCatalog } from "@/lib/searchVideos";
import type { Ad, Company, Product } from "@/types";

const company = (id: string, name: string): Company => ({
  id, name, logoUrl: "", bannerUrl: "", verified: false, category: "Fitness", location: "", website: "", description: "", followers: 0,
});
const product = (id: string, companyId: string, name: string, category: Product["category"]): Product => ({
  id, companyId, name, description: "", imageUrl: "", price: 1, category, url: "", rating: 5, highlights: [],
});
const ad = (id: string, companyId: string, productId: string, caption: string, category: Ad["category"]): Ad => ({
  id, companyId, productId, campaignId: "c", videoUrl: "v.m3u8", posterUrl: "", caption, category, ctaLabel: "Kijk",
  moderationStatus: "approved", rewardRules: { watch80: 15, like: 4, save: 8, click: 10 },
});

const catalog: LocalCatalog = {
  companies: [company("c1", "Lucas Bedrijf"), company("c2", "Schoenwinkel")],
  products: [
    product("p1", "c1", "FitMatch", "Fitness"),
    product("p2", "c1", "Mondzorgmatch", "Fitness"),
    product("p3", "c2", "Sneakers Air", "Fashion"),
    product("p4", "c2", "Hoodie", "Fashion"),
    product("p5", "c1", "Pizza", "Food"),
  ],
  ads: [
    ad("a1", "c1", "p1", "Eindelijk een match voor jou", "Fitness"),
    ad("a2", "c1", "p2", "Ben jij ook benieuwd?", "Fitness"),
    ad("a3", "c1", "p2", "Ben jij ook benieuwd?", "Fitness"),
    ad("a4", "c2", "p3", "Nieuwe schoenen die er goed uitzien", "Fashion"),
    ad("a5", "c2", "p4", "Warme hoodie", "Fashion"),
    ad("a6", "c1", "p5", "Verse pizza", "Food"),
  ],
};
const ids = (list: { objectID: string }[]) => list.map((h) => h.objectID.replace("ad-", ""));

describe("zoeken in de video's", () => {
  it("een merknaam geeft eerst de video van dat merk en daarna video's uit dezelfde categorie", async () => {
    const r = await searchEverything("FitMatch", catalog);
    expect(ids(r.ads)).toEqual(["a1"]);
    expect(ids(r.relatedAds)).toEqual(["a2", "a3"]); // ook fitness, maar niets uit mode of eten
  });

  it("schoenen geeft schoenenvideo's en daarna meer mode, nooit willekeurig eten", async () => {
    const r = await searchEverything("schoenen", catalog);
    expect(ids(r.ads)).toContain("a4");
    const all = [...ids(r.ads), ...ids(r.relatedAds)];
    expect(all).toContain("a5"); // hoodie: dezelfde categorie
    expect(all).not.toContain("a6"); // pizza hoort er niet bij
    expect(all).not.toContain("a1");
  });

  it("een naam telt zwaarder dan een woord in de tekst", async () => {
    const r = await searchEverything("match", catalog);
    expect(ids(r.ads)[0]).toBe("a1"); // FitMatch (productnaam) vóór Mondzorgmatch
    expect(ids(r.ads)).toContain("a2");
  });

  it("zonder treffers en zonder verwante categorie komt er niets", async () => {
    const r = await searchEverything("qqqqzzzz", catalog);
    expect(r.ads).toEqual([]);
    expect(r.relatedAds).toEqual([]);
  });

  it("video's die niet goedgekeurd zijn of van een onbekend bedrijf komen niet voor", async () => {
    const hidden: LocalCatalog = {
      ...catalog,
      ads: [...catalog.ads, { ...ad("a7", "c1", "p1", "FitMatch concept", "Fitness"), moderationStatus: "pending" }, ad("a8", "bestaat-niet", "p1", "FitMatch spook", "Fitness")],
    };
    const r = await searchEverything("FitMatch", hidden);
    const all = [...ids(r.ads), ...ids(r.relatedAds)];
    expect(all).not.toContain("a7");
    expect(all).not.toContain("a8");
  });
});
