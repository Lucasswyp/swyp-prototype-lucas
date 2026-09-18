"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Pause, Play, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useBusiness } from "@/contexts/BusinessContext";
import { useData } from "@/contexts/DataContext";
import { fetchInteractionsForBusiness, computeAnalytics, updateCampaignStatus as updateCampaignStatusRemote, type Interaction } from "@/lib/data";
import { formatEuro, formatNumber, cn } from "@/lib/utils";
import type { CampaignStatus } from "@/types";

const statusStyles: Record<CampaignStatus, string> = {
  Active: "bg-emerald-500/15 text-emerald-300",
  Paused: "bg-yellow-500/15 text-yellow-300",
  Draft: "bg-white/10 text-white/50",
  Completed: "bg-white/10 text-white/40",
};

export default function CampaignsPage() {
  const { businessId } = useBusiness();
  const { campaigns, refresh } = useData();
  const [filter, setFilter] = useState<CampaignStatus | "Alle">("Alle");
  const [interactions, setInteractions] = useState<Interaction[]>([]);

  useEffect(() => {
    fetchInteractionsForBusiness(businessId).then(setInteractions);
  }, [businessId]);

  const ownCampaigns = useMemo(() => campaigns.filter((c) => c.companyId === businessId), [campaigns, businessId]);
  const filtered = filter === "Alle" ? ownCampaigns : ownCampaigns.filter((c) => c.status === filter);

  async function toggleStatus(id: string, status: CampaignStatus) {
    await updateCampaignStatusRemote(id, status === "Active" ? "Paused" : "Active");
    refresh();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold mb-1">Campaigns</h1>
          <p className="text-white/50 text-sm">Beheer en analyseer al je Swyp-campagnes.</p>
        </div>
        <Link href="/business/campaigns/new">
          <Button className="gap-1.5">
            <Plus size={16} /> Nieuwe campagne
          </Button>
        </Link>
      </div>

      <div className="flex gap-2 mb-4">
        {(["Alle", "Active", "Paused", "Draft", "Completed"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-xs font-medium border",
              filter === s ? "bg-white text-indigo border-transparent" : "border-white/15 text-white/50"
            )}
          >
            {s}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-sm text-white/50">Nog geen campagnes. Maak je eerste campagne aan.</p>
        </Card>
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr className="text-left text-xs text-white/40 border-b border-white/10">
                <th className="px-4 py-3 font-medium">Campaign</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Budget</th>
                <th className="px-4 py-3 font-medium">Impressions</th>
                <th className="px-4 py-3 font-medium">Engagement</th>
                <th className="px-4 py-3 font-medium">Clicks</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => {
                const a = computeAnalytics(interactions, c.adId);
                const engagement = a.impressions > 0 ? ((a.likes + a.saves) / a.impressions) * 100 : 0;
                return (
                  <tr key={c.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                    <td className="px-4 py-3">
                      <Link href={`/business/campaigns/${c.id}`} className="font-medium hover:text-magenta">
                        {c.name}
                      </Link>
                      <p className="text-xs text-white/35">{c.objective}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", statusStyles[c.status])}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 tabular-nums">{formatEuro(c.totalBudget)}</td>
                    <td className="px-4 py-3 tabular-nums">{formatNumber(a.impressions)}</td>
                    <td className="px-4 py-3 tabular-nums">{engagement.toFixed(1)}%</td>
                    <td className="px-4 py-3 tabular-nums">{formatNumber(a.clicks)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        {(c.status === "Active" || c.status === "Paused") && (
                          <button
                            title={c.status === "Active" ? "Pauzeer" : "Hervat"}
                            onClick={() => toggleStatus(c.id, c.status)}
                            className="rounded-lg p-1.5 hover:bg-white/10"
                          >
                            {c.status === "Active" ? <Pause size={15} /> : <Play size={15} />}
                          </button>
                        )}
                        <Link href={`/business/campaigns/${c.id}`} title="Analytics" className="rounded-lg p-1.5 hover:bg-white/10 block">
                          <BarChart3 size={15} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
