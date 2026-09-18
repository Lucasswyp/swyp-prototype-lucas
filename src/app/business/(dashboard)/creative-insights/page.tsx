"use client";

import { useMemo } from "react";
import { Lightbulb } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { useBusiness } from "@/contexts/BusinessContext";
import { useData } from "@/contexts/DataContext";

const insightTemplates = [
  (name: string) => `Video "${name}" houdt kijkers vast in de eerste drie seconden — een sterke hook.`,
  () => `Productshots vroeg in de video correleren met hogere saves.`,
  () => `Deze advertentie doet het goed bij herhaalde weergaven.`,
  (name: string) => `De CTA op "${name}" is duidelijk en actiegericht.`,
];

export default function CreativeInsightsPage() {
  const { businessId } = useBusiness();
  const { ads, products } = useData();
  const ownAds = useMemo(() => ads.filter((a) => a.companyId === businessId), [ads, businessId]);

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold mb-1">Creative Insights</h1>
      <p className="text-white/50 text-sm mb-1">
        Automatisch gegenereerde inzichten over je eigen advertenties.
      </p>
      <span className="inline-block text-[11px] font-semibold text-magenta bg-magenta/10 rounded-full px-2.5 py-1 mb-6">
        Demo insights — gebaseerd op algemene best practices, niet op AI-analyse van je video
      </span>

      {ownAds.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-sm text-white/50">Nog geen advertenties. Maak een campagne aan om hier inzichten te zien.</p>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {ownAds.map((ad, i) => {
            const product = products.find((p) => p.id === ad.productId);
            const insight = insightTemplates[i % insightTemplates.length](product?.name ?? "deze advertentie");
            return (
              <Card key={ad.id} className="p-4 flex gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={ad.posterUrl} alt="" className="h-16 w-16 rounded-xl object-cover shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold mb-1 truncate">{product?.name}</p>
                  <p className="text-xs text-white/60 leading-relaxed flex items-start gap-1.5">
                    <Lightbulb size={13} className="text-yellow-400 shrink-0 mt-0.5" />
                    {insight}
                  </p>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
