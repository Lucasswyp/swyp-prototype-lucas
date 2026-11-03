import { describe, expect, it } from "vitest";
import { getSuggestions } from "@/lib/searchSuggestions";

const content = [
  { text: "Nike Air Max 90", kind: "product" as const },
  { text: "Nordic Coffee", kind: "bedrijf" as const },
  { text: "Hoodie Classic", kind: "product" as const },
];

describe("getSuggestions", () => {
  it("geeft voorstellen die met de typte letters beginnen", () => {
    const s = getSuggestions("n", content);
    expect(s.length).toBeGreaterThan(3);
    expect(s.length).toBeLessThanOrEqual(8);
    expect(s.some((x) => x.text.toLowerCase().startsWith("n"))).toBe(true);
  });

  it("zet wat echt in Swyp staat bovenaan", () => {
    const s = getSuggestions("n", content);
    expect(s[0].kind).toBeDefined();
    expect(["Nike Air Max 90", "Nordic Coffee"]).toContain(s[0].text);
  });

  it("wordt preciezer met meer letters", () => {
    const few = getSuggestions("n", content, 50).length;
    const more = getSuggestions("nik", content, 50).length;
    expect(more).toBeLessThan(few);
    expect(getSuggestions("nik", content).every((x) => x.text.toLowerCase().includes("nik"))).toBe(true);
  });

  it("vindt het woordenboek: nike staat erbij", () => {
    const s = getSuggestions("nik", []);
    expect(s.map((x) => x.text)).toContain("nike");
  });

  it("negeert hoofdletters en accenten, en lege invoer geeft niets", () => {
    expect(getSuggestions("NIK", []).map((x) => x.text)).toContain("nike");
    expect(getSuggestions("   ", content)).toEqual([]);
  });

  it("stelt niet voor wat er al precies staat", () => {
    expect(getSuggestions("nike", []).map((x) => x.text)).not.toContain("nike");
  });

  it("vindt een later woord in een zin", () => {
    const s = getSuggestions("schoen", []).map((x) => x.text);
    expect(s.length).toBeGreaterThan(0);
  });
});
