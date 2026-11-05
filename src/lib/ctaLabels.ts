import type { CampaignObjective } from "@/types";

// De tekst op de knop onder een video. Bedrijven kiezen uit een korte lijst, zodat kijkers overal
// dezelfde duidelijke woorden zien; eigen tekst mag, maar kort en zonder uitroeptekens of pijltjes
// (de pijl zet de app er zelf achter).
export const CTA_LABELS = [
  "Bekijk aanbod",
  "Bekijk product",
  "Meer info",
  "Bestel nu",
  "Boek nu",
  "Reserveer een tafel",
  "Maak een afspraak",
  "Meld je aan",
  "Kom langs",
  "Download de app",
  "Naar de website",
] as const;

export const CTA_DEFAULT_LABEL = "Bekijk aanbod";
export const CTA_MAX_LENGTH = 24;

const FOR_OBJECTIVE: Record<CampaignObjective, string> = {
  "Brand awareness": "Meer info",
  Engagement: "Bekijk aanbod",
  "Website traffic": "Naar de website",
  Sales: "Bestel nu",
  "Store visits": "Kom langs",
  "App downloads": "Download de app",
};

export function ctaLabelForObjective(objective: CampaignObjective): string {
  return FOR_OBJECTIVE[objective] ?? CTA_DEFAULT_LABEL;
}

/** Netjes maken: spaties, geen pijl of uitroeptekens aan het eind, niet te lang. Leeg wordt de standaard. */
export function cleanCtaLabel(raw: string | null | undefined): string {
  const text = (raw ?? "")
    .replace(/[→➜➔➡>]+/g, " ")
    .replace(/[!?.]+\s*$/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, CTA_MAX_LENGTH)
    .trim();
  return text || CTA_DEFAULT_LABEL;
}

export function isPresetCtaLabel(label: string): boolean {
  return (CTA_LABELS as readonly string[]).includes(label);
}
