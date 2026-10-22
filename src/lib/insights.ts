// Inzichten per video, afgeleid van de echte cijfers van dat bedrijf. Geen
// gokwerk: onder MIN_IMPRESSIONS weergaven zeggen we eerlijk dat het nog te
// vroeg is.
export const MIN_IMPRESSIONS = 20;

export interface AdMetrics {
  impressions: number;
  watch80: number;
  likes: number;
  saves: number;
  clicks: number;
  shares: number;
}

export interface Insight {
  tone: "good" | "warn" | "info";
  text: string;
}

export interface AdInsights {
  enough: boolean;
  completionRate: number;
  engagementRate: number;
  clickRate: number;
  insights: Insight[];
}

const pct = (n: number) => `${Math.round(n * 100)}%`;

export function buildAdInsights(m: AdMetrics): AdInsights {
  const rate = (n: number) => (m.impressions > 0 ? n / m.impressions : 0);
  const completionRate = rate(m.watch80);
  const engagementRate = rate(m.likes + m.saves);
  const clickRate = rate(m.clicks);

  if (m.impressions < MIN_IMPRESSIONS) {
    return {
      enough: false,
      completionRate,
      engagementRate,
      clickRate,
      insights: [{ tone: "info", text: `Nog te weinig weergaven voor een betrouwbaar oordeel (${m.impressions} van ${MIN_IMPRESSIONS}).` }],
    };
  }

  const insights: Insight[] = [];

  if (completionRate >= 0.5) {
    insights.push({ tone: "good", text: `${pct(completionRate)} van de kijkers kijkt de video (bijna) helemaal uit. Dat is sterk.` });
  } else if (completionRate < 0.25) {
    insights.push({ tone: "warn", text: `Slechts ${pct(completionRate)} kijkt de video uit. Maak de eerste 3 seconden pakkender of kort de video in.` });
  }

  if (engagementRate >= 0.1) {
    insights.push({ tone: "good", text: `${pct(engagementRate)} liket of bewaart de video. Het product spreekt aan.` });
  } else if (engagementRate < 0.03) {
    insights.push({ tone: "warn", text: "Weinig likes en opslagen. Laat duidelijker zien wat dit product bijzonder maakt." });
  }

  if (clickRate >= 0.05) {
    insights.push({ tone: "good", text: `${pct(clickRate)} klikt door naar het product. Je oproep werkt.` });
  } else if (clickRate < 0.01) {
    insights.push({ tone: "warn", text: "Bijna niemand klikt door. Maak je aanbod of de knoptekst concreter." });
  }

  if (m.shares > 0) {
    insights.push({ tone: "good", text: `${m.shares}x doorgestuurd naar vrienden.` });
  }

  if (insights.length === 0) {
    insights.push({ tone: "info", text: "Deze video presteert gemiddeld. Probeer eens een andere opening of beschrijving en vergelijk." });
  }

  return { enough: true, completionRate, engagementRate, clickRate, insights };
}

// Voor de volgorde op de pagina: beste eerst, video's met te weinig data onderaan.
export function compareByEngagement(a: AdInsights, b: AdInsights) {
  if (a.enough !== b.enough) return a.enough ? -1 : 1;
  return b.engagementRate - a.engagementRate;
}
