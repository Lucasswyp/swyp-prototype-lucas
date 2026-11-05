import { describe, expect, it } from "vitest";
import { ONBOARDING_SLIDES } from "@/lib/onboardingSlides";
import { FIXED_REWARDS } from "@/lib/data";

describe("ONBOARDING_SLIDES", () => {
  it("noemt de echte aantallen tokens", () => {
    const text = ONBOARDING_SLIDES.map((s) => s.body).join(" ");
    for (const n of Object.values(FIXED_REWARDS)) expect(text).toContain(`+${n}`);
    expect(text).toContain("€0,01");
  });

  it("belooft niets wat Swyp niet doet", () => {
    const text = (ONBOARDING_SLIDES.map((s) => `${s.title} ${s.body}`).join(" ")).toLowerCase();
    for (const w of ["geen ruis", "gratis producten", "upgrades", "continu", "waardevol"]) expect(text).not.toContain(w);
  });

  it("heeft vier schermen met een titel en uitleg", () => {
    expect(ONBOARDING_SLIDES).toHaveLength(4);
    for (const s of ONBOARDING_SLIDES) {
      expect(s.title.length).toBeGreaterThan(5);
      expect(s.body.length).toBeGreaterThan(20);
    }
  });
});
