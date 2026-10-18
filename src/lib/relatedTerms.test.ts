import { describe, expect, it } from "vitest";
import { getRelatedTerms, relatedTermCount } from "@/lib/relatedTerms";

describe("getRelatedTerms", () => {
  it("heeft meer dan 5000 woorden", () => {
    expect(relatedTermCount()).toBeGreaterThan(5000);
  });

  it("koppelt een merk aan verwante producten", () => {
    const r = getRelatedTerms("adidas");
    expect(r.terms).toContain("sneakers");
    expect(r.terms).not.toContain("adidas");
    expect(r.categories).toContain("Fashion");
  });

  it("negeert hoofdletters en accenten", () => {
    expect(getRelatedTerms("Café").terms.length).toBeGreaterThan(0);
  });

  it("vindt termen terwijl de gebruiker nog typt", () => {
    expect(getRelatedTerms("adid").terms).toContain("nike");
  });

  it("herkent een meervoud", () => {
    expect(getRelatedTerms("sneaker").terms.length).toBeGreaterThan(0);
  });

  it("neemt verwante categorieën mee", () => {
    const r = getRelatedTerms("pizza");
    expect(r.categories).toContain("Food");
    expect(r.categories).toContain("Restaurants");
  });

  it("geeft niets terug voor onzin en lege invoer", () => {
    expect(getRelatedTerms("qzxvbnm").terms).toEqual([]);
    expect(getRelatedTerms("   ").terms).toEqual([]);
  });

  it("houdt de lijst begrensd", () => {
    const r = getRelatedTerms("eten");
    expect(r.terms.length).toBeLessThanOrEqual(30);
    expect(r.terms.join(" ").length).toBeLessThan(500);
  });
});
