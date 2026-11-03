import { describe, expect, it } from "vitest";
import { CTA_DEFAULT_COLOR, CTA_PRESETS, ctaTextColor, isCtaColor, normalizeCtaColor } from "@/lib/ctaColor";
import { describeVideoFormat, videoFit } from "@/lib/videoFit";

describe("ctaColor", () => {
  it("accepteert alleen zes cijfers hex en valt anders terug op wit", () => {
    expect(isCtaColor("#7B3DFF")).toBe(true);
    expect(isCtaColor("7B3DFF")).toBe(false);
    expect(isCtaColor("#fff")).toBe(false);
    expect(isCtaColor("url(javascript:1)")).toBe(false);
    expect(normalizeCtaColor("#ff3edb")).toBe("#FF3EDB");
    expect(normalizeCtaColor(null)).toBe(CTA_DEFAULT_COLOR);
    expect(normalizeCtaColor("red; background:url(x)")).toBe(CTA_DEFAULT_COLOR);
  });

  it("kiest donkere tekst op lichte knoppen en witte tekst op donkere", () => {
    expect(ctaTextColor("#FFFFFF")).toBe("#0B0A2E");
    expect(ctaTextColor("#22C55E")).toBe("#0B0A2E");
    expect(ctaTextColor("#FF8A1F")).toBe("#0B0A2E");
    expect(ctaTextColor("#0B0A2E")).toBe("#FFFFFF");
    expect(ctaTextColor("#7B3DFF")).toBe("#FFFFFF");
  });

  it("alle voorgestelde kleuren zijn geldig", () => {
    for (const c of CTA_PRESETS) expect(isCtaColor(c.hex)).toBe(true);
  });
});

describe("videoFit", () => {
  it("9:16 vult het scherm, ook met een paar procent afwijking", () => {
    expect(videoFit(1080, 1920)).toBe("cover");
    expect(videoFit(720, 1280)).toBe("cover");
    expect(videoFit(1080, 2160)).toBe("cover"); // 9:18 telefoon-opname
  });

  it("vierkant, 4:5 en liggend worden niet afgesneden", () => {
    expect(videoFit(1080, 1080)).toBe("contain");
    expect(videoFit(1080, 1350)).toBe("contain");
    expect(videoFit(1920, 1080)).toBe("contain");
  });

  it("onbekende afmetingen vallen terug op schermvullend", () => {
    expect(videoFit(0, 0)).toBe("cover");
  });

  it("legt het formaat uit", () => {
    expect(describeVideoFormat(1080, 1920).ok).toBe(true);
    expect(describeVideoFormat(1920, 1080).ok).toBe(false);
    expect(describeVideoFormat(0, 0).text).toBe("");
  });
});
