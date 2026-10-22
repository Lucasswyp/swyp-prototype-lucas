"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Pause, Play, BarChart3, Wallet } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { MIN_TOP_UP, planTopUp } from "@/lib/campaignTopUp";
import { useBusiness } from "@/contexts/BusinessContext";
import { useData } from "@/contexts/DataContext";
import { fetchInteractionsForBusiness, fetchCampaignSpend, computeAnalytics, topUpCampaign, updateCampaignStatus as updateCampaignStatusRemote, type Interaction } from "@/lib/data";
import { formatEuro, formatNumber, cn } from "@/lib/utils";
import type { Campaign, CampaignStatus } from "@/types";

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
  const [spend, setSpend] = useState<Record<string, { spent: number; today: number }>>({});
  const [topUp, setTopUp] = useState<Campaign | null>(null);
  const [extra, setExtra] = useState("");
  const [topUpError, setTopUpError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCampaignSpend().then(setSpend).catch(() => {});
  }, []);

  useEffect(() => {
    fetchInteractionsForBusiness(businessId).then(setInteractions);
  }, [businessId]);

  const ownCampaigns = useMemo(() => campaigns.filter((c) => c.companyId === businessId), [campaigns, businessId]);
  const filtered = filter === "Alle" ? ownCampaigns : ownCampaigns.filter((c) => c.status === filter);

  async function toggleStatus(id: string, status: CampaignStatus) {
    await updateCampaignStatusRemote(id, status === "Active" ? "Paused" : "Active");
    refresh();
  }

  async function submitTopUp() {
    if (!topUp || saving) return;
    const today = new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Amsterdam" });
    const plan = planTopUp(topUp, spend[topUp.id]?.spent ?? 0, Number(extra.replace(",", ".")), today);
    if ("error" in plan) {
      setTopUpError(plan.error);
      return;
    }
    setSaving(true);
    try {
      await topUpCampaign(topUp.id, plan);
      setTopUp(null);
      setExtra("");
      setTopUpError(null);
      fetchCampaignSpend().then(setSpend).catch(() => {});
      refresh();
    } catch {
      setTopUpError("Bijvullen is mislukt. Probeer het opnieuw.");
    } finally {
      setSaving(false);
    }
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
                    <td className="px-4 py-3 tabular-nums">
                      {formatEuro(c.totalBudget)}
                      {spend[c.id] && (
                        <p className="text-xs text-white/40">{formatEuro(spend[c.id].spent)} besteed</p>
                      )}
                    </td>
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
                        {c.status === "Completed" && (
                          <button
                            title="Budget bijvullen"
                            onClick={() => {
                              setTopUp(c);
                              setExtra("");
                              setTopUpError(null);
                            }}
                            className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-white/10"
                          >
                            <Wallet size={14} /> Bijvullen
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

      <Modal open={!!topUp} onClose={() => setTopUp(null)} title="Budget bijvullen">
        {topUp && (
          <div>
            <p className="text-sm text-white/60 mb-4">
              &ldquo;{topUp.name}&rdquo; heeft {formatEuro(spend[topUp.id]?.spent ?? 0)} van {formatEuro(topUp.totalBudget)} uitgegeven en staat daarom stil. Met extra
              budget gaat hij direct weer live.
            </p>
            <label className="block text-xs font-medium text-white/50 mb-1.5" htmlFor="topup-extra">
              Extra budget (€)
            </label>
            <input
              id="topup-extra"
              inputMode="decimal"
              value={extra}
              onChange={(e) => setExtra(e.target.value)}
              placeholder={`Minstens ${MIN_TOP_UP}`}
              className="w-full rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-sm outline-none placeholder:text-white/30"
            />
            {topUpError && <p role="alert" className="mt-2 text-xs text-red-300">{topUpError}</p>}
            <div className="mt-5 flex gap-2">
              <Button variant="secondary" fullWidth onClick={() => setTopUp(null)}>
                Annuleren
              </Button>
              <Button fullWidth onClick={submitTopUp} disabled={saving}>
                {saving ? "Bezig..." : "Bijvullen en live zetten"}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
