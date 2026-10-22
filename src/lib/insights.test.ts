import { describe, expect, it } from "vitest";
import { MIN_IMPRESSIONS, buildAdInsights, compareByEngagement } from "@/lib/insights";

const base = { impressions: 100, watch80: 0, likes: 0, saves: 0, clicks: 0, shares: 0 };

describe("buildAdInsights", () => {
  it("zegt eerlijk dat er te weinig data is", () => {
    const r = buildAdInsights({ ...base, impressions: MIN_IMPRESSIONS - 1, likes: 10 });
    expect(r.enough).toBe(false);
    expect(r.insights).toHaveLength(1);
    expect(r.insights[0].tone).toBe("info");
    expect(r.insights[0].text).toContain("19 van 20");
  });

  it("deelt niet door nul", () => {
    const r = buildAdInsights({ impressions: 0, watch80: 0, likes: 0, saves: 0, clicks: 0, shares: 0 });
    expect(r.completionRate).toBe(0);
    expect(r.enough).toBe(false);
  });

  it("geeft een compliment bij sterke cijfers, met de echte percentages", () => {
    const r = buildAdInsights({ impressions: 200, watch80: 120, likes: 20, saves: 10, clicks: 14, shares: 3 });
    const texts = r.insights.map((i) => i.text).join(" | ");
    expect(r.insights.every((i) => i.tone === "good")).toBe(true);
    expect(texts).toContain("60%");
    expect(texts).toContain("15%");
    expect(texts).toContain("7%");
    expect(texts).toContain("3x doorgestuurd");
  });

  it("waarschuwt bij zwakke cijfers", () => {
    const r = buildAdInsights({ ...base, watch80: 10, likes: 1, saves: 0, clicks: 0 });
    expect(r.insights.filter((i) => i.tone === "warn")).toHaveLength(3);
  });

  it("noemt een middenmoter gemiddeld", () => {
    const r = buildAdInsights({ ...base, watch80: 35, likes: 4, saves: 2, clicks: 3 });
    expect(r.insights).toEqual([{ tone: "info", text: expect.stringContaining("gemiddeld") }]);
  });

  it("telt een share ook mee zonder andere uitschieters", () => {
    const r = buildAdInsights({ ...base, watch80: 35, likes: 4, saves: 2, clicks: 3, shares: 1 });
    expect(r.insights.some((i) => i.text.includes("1x doorgestuurd"))).toBe(true);
  });
});

describe("compareByEngagement", () => {
  it("zet de beste eerst en video's zonder genoeg data onderaan", () => {
    const low = buildAdInsights({ ...base, likes: 2 });
    const high = buildAdInsights({ ...base, likes: 30 });
    const early = buildAdInsights({ ...base, impressions: 3, likes: 3 });
    expect([early, low, high].sort(compareByEngagement)).toEqual([high, low, early]);
  });
});
