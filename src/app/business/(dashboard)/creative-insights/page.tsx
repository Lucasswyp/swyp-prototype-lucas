"use client";

import { useEffect, useMemo, useState } from "react";
import { Lightbulb, TrendingUp, TriangleAlert, Info } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { AdThumb } from "@/components/consumer/AdThumb";
import { useBusiness } from "@/contexts/BusinessContext";
import { useData } from "@/contexts/DataContext";
import { fetchInteractionsForBusiness, computeAnalytics, type Interaction } from "@/lib/data";
import { MIN_IMPRESSIONS, buildAdInsights, compareByEngagement } from "@/lib/insights";
import { formatNumber } from "@/lib/utils";

const toneIcon = {
  good: <TrendingUp size={13} className="text-emerald-400 shrink-0 mt-0.5" />,
  warn: <TriangleAlert size={13} className="text-yellow-400 shrink-0 mt-0.5" />,
  info: <Info size={13} className="text-white/40 shrink-0 mt-0.5" />,
};

const pct = (n: number) => `${(n * 100).toFixed(1).replace(".", ",")}%`;

export default function CreativeInsightsPage() {
  const { businessId } = useBusiness();
  const { ads, products } = useData();
  const [interactions, setInteractions] = useState<Interaction[] | null>(null);

  useEffect(() => {
    fetchInteractionsForBusiness(businessId)
      .then(setInteractions)
      .catch(() => setInteractions([]));
  }, [businessId]);

  const rows = useMemo(() => {
    if (!interactions) return [];
    return ads
      .filter((a) => a.companyId === businessId)
      .map((ad) => {
        const totals = computeAnalytics(interactions, ad.id);
        const insight = buildAdInsights({
          impressions: totals.impressions,
          watch80: totals.watch80,
          likes: totals.likes,
          saves: totals.saves,
          clicks: totals.clicks,
          shares: totals.shares,
        });
        return { ad, totals, insight, product: products.find((p) => p.id === ad.productId) };
      })
      .sort((a, b) => compareByEngagement(a.insight, b.insight));
  }, [ads, products, interactions, businessId]);

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold mb-1">Creative Insights</h1>
      <p className="text-white/50 text-sm mb-6">
        Wat er echt gebeurt met je video&apos;s, afgeleid van je eigen cijfers. Vanaf {MIN_IMPRESSIONS} weergaven per video geven we tips.
      </p>

      {interactions === null ? (
        <Card className="p-8 text-center">
          <p className="text-sm text-white/50">Laden...</p>
        </Card>
      ) : rows.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-sm text-white/50">Nog geen advertenties. Maak een campagne aan om hier inzichten te zien.</p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {rows.map(({ ad, totals, insight, product }, i) => (
            <Card key={ad.id} className="p-4">
              <div className="flex gap-3">
                <div className="relative h-24 w-[54px] shrink-0 overflow-hidden rounded-xl bg-white/5">
                  <AdThumb posterUrl={ad.posterUrl} videoUrl={ad.videoUrl} fallbackImageUrl={product?.imageUrl} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex items-center gap-2">
                    <p className="truncate text-sm font-semibold">{product?.name ?? ad.caption}</p>
                    {i === 0 && insight.enough && rows.filter((r) => r.insight.enough).length > 1 && (
                      <span className="shrink-0 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-300">Beste video</span>
                    )}
                  </div>
                  <div className="mb-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs sm:grid-cols-4">
                    <Stat label="Weergaven" value={formatNumber(totals.impressions)} />
                    <Stat label="Uitgekeken" value={insight.enough ? pct(insight.completionRate) : "-"} />
                    <Stat label="Likes en opslagen" value={insight.enough ? pct(insight.engagementRate) : "-"} />
                    <Stat label="Doorgeklikt" value={insight.enough ? pct(insight.clickRate) : "-"} />
                  </div>
                  <ul className="grid gap-1.5">
                    {insight.insights.map((it, idx) => (
                      <li key={idx} className="flex items-start gap-1.5 text-xs leading-relaxed text-white/65">
                        {toneIcon[it.tone]}
                        {it.text}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <p className="mt-6 flex items-start gap-1.5 text-xs text-white/35">
        <Lightbulb size={13} className="mt-0.5 shrink-0" />
        Percentages zijn het aandeel van het aantal weergaven. Dubbele weergaven van hetzelfde apparaat tellen binnen 30 minuten één keer mee.
      </p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-white/40">{label}</p>
      <p className="font-semibold tabular-nums">{value}</p>
    </div>
  );
}
