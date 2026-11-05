import { describe, expect, it } from "vitest";
import { BUSINESS_CATEGORY_OPTIONS } from "@/lib/businessCategories";

describe("BUSINESS_CATEGORY_OPTIONS", () => {
  it("heeft unieke namen en unieke bewaarde categorieën", () => {
    expect(new Set(BUSINESS_CATEGORY_OPTIONS.map((c) => c.label)).size).toBe(BUSINESS_CATEGORY_OPTIONS.length);
    expect(new Set(BUSINESS_CATEGORY_OPTIONS.map((c) => c.value)).size).toBe(BUSINESS_CATEGORY_OPTIONS.length);
  });

  it("noemt een kapper en een café, zodat de eerste bedrijven zich herkennen", () => {
    const labels = BUSINESS_CATEGORY_OPTIONS.map((c) => c.label.toLowerCase()).join(" | ");
    expect(labels).toContain("kapper");
    expect(labels).toContain("café");
  });
});
