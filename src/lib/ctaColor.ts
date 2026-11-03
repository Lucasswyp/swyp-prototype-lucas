// Kleur van de knop onder een video (bijvoorbeeld "Bekijk product →"). Elk bedrijf kiest die
// zelf; de tekstkleur wordt automatisch donker of licht gekozen zodat de knop leesbaar blijft.

export const CTA_DEFAULT_COLOR = "#FFFFFF";

export const CTA_PRESETS = [
  { name: "Wit", hex: "#FFFFFF" },
  { name: "Violet", hex: "#7B3DFF" },
  { name: "Magenta", hex: "#FF3EDB" },
  { name: "Blauw", hex: "#2D7BFF" },
  { name: "Groen", hex: "#22C55E" },
  { name: "Oranje", hex: "#FF8A1F" },
  { name: "Zwart", hex: "#0B0A2E" },
] as const;

const HEX = /^#[0-9a-fA-F]{6}$/;

export function isCtaColor(value: unknown): value is string {
  return typeof value === "string" && HEX.test(value);
}

/** Geldige kleur in hoofdletters, anders de standaard (wit). */
export function normalizeCtaColor(value: unknown): string {
  return isCtaColor(value) ? value.toUpperCase() : CTA_DEFAULT_COLOR;
}

function channel(v: number) {
  const s = v / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

const DARK_TEXT = "#0B0A2E";

function luminanceOf(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** Donkere of witte tekst, wat het meeste contrast geeft met de knopkleur (WCAG). */
export function ctaTextColor(background: string): string {
  const bg = luminanceOf(normalizeCtaColor(background));
  const contrastWhite = 1.05 / (bg + 0.05);
  const contrastDark = (bg + 0.05) / (luminanceOf(DARK_TEXT) + 0.05);
  return contrastDark >= contrastWhite ? DARK_TEXT : "#FFFFFF";
}
