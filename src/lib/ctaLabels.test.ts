import { describe, expect, it } from "vitest";
import { CTA_DEFAULT_LABEL, CTA_LABELS, CTA_MAX_LENGTH, cleanCtaLabel, ctaLabelForObjective, isPresetCtaLabel } from "@/lib/ctaLabels";

describe("cleanCtaLabel", () => {
  it("haalt pijl en uitroeptekens weg", () => {
    expect(cleanCtaLabel("Klik dan hier! →")).toBe("Klik dan hier");
    expect(cleanCtaLabel("Download hier!!")).toBe("Download hier");
    expect(cleanCtaLabel("Bekijk aanbod →")).toBe("Bekijk aanbod");
  });

  it("maakt spaties netjes en kapt te lange tekst af", () => {
    expect(cleanCtaLabel("  Boek   nu  ")).toBe("Boek nu");
    const long = cleanCtaLabel("Dit is een veel te lange tekst voor op een knop");
    expect(long.length).toBeLessThanOrEqual(CTA_MAX_LENGTH);
  });

  it("valt terug op de standaard bij leeg", () => {
    expect(cleanCtaLabel("")).toBe(CTA_DEFAULT_LABEL);
    expect(cleanCtaLabel("  →  ")).toBe(CTA_DEFAULT_LABEL);
    expect(cleanCtaLabel(undefined)).toBe(CTA_DEFAULT_LABEL);
  });

  it("laat een gewone tekst met een vraagteken midden in staan", () => {
    expect(cleanCtaLabel("Wat kost het? Kijk")).toBe("Wat kost het? Kijk");
  });
});

describe("de lijst", () => {
  it("heeft alleen teksten die op de knop passen, en de standaard staat erin", () => {
    for (const l of CTA_LABELS) expect(l.length).toBeLessThanOrEqual(CTA_MAX_LENGTH);
    expect(isPresetCtaLabel(CTA_DEFAULT_LABEL)).toBe(true);
    expect(isPresetCtaLabel("Klik dan hier")).toBe(false);
  });

  it("stelt bij elk campagnedoel een tekst uit de lijst voor", () => {
    for (const o of ["Brand awareness", "Engagement", "Website traffic", "Sales", "Store visits", "App downloads"] as const) {
      expect(isPresetCtaLabel(ctaLabelForObjective(o))).toBe(true);
    }
    expect(ctaLabelForObjective("App downloads")).toBe("Download de app");
  });
});
