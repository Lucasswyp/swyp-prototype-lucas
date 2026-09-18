"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { ChevronLeft, Heart, Bookmark, MousePointerClick } from "lucide-react";
import { MetricCard } from "@/components/business/MetricCard";
import { ChartContainer } from "@/components/business/ChartContainer";
import { useBusiness } from "@/contexts/BusinessContext";
import { useData } from "@/contexts/DataContext";
import { fetchInteractionsForBusiness, computeAnalytics, type Interaction } from "@/lib/data";
import { formatEuro, formatNumber, formatPercent, formatDate } from "@/lib/utils";
import { dailySeries } from "@/lib/chartData";

export default function CampaignAnalyticsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { businessId } = useBusiness();
  const { campaigns } = useData();
  const [interactions, setInteractions] = useState<Interaction[]>([]);

  useEffect(() => {
    fetchInteractionsForBusiness(businessId).then(setInteractions);
    const interval = setInterval(() => fetchInteractionsForBusiness(businessId).then(setInteractions), 15000);
    return () => clearInterval(interval);
  }, [businessId]);

  const campaign = useMemo(() => campaigns.find((c) => c.id === id), [campaigns, id]);
  const totals = useMemo(() => computeAnalytics(interactions, campaign?.adId), [interactions, campaign]);

  const viewSeries = useMemo(() => {
    const days = dailySeries(0).map((d) => ({ ...d, value: 0 }));
    interactions
      .filter((i) => i.event_name === "impression" && i.ad_id === campaign?.adId)
      .forEach((i) => {
        const label = new Date(i.created_at).toLocaleDateString("nl-NL", { day: "numeric", month: "short" });
        const day = days.find((d) => d.date === label);
        if (day) day.value += 1;
      });
    return days;
  }, [interactions, campaign]);

  if (!campaign) {
    return (
      <div>
        <p className="text-white/50 text-sm">Campagne niet gevonden.</p>
      </div>
    );
  }

  const completionRate = totals.impressions > 0 ? (totals.watch80 / totals.impressions) * 100 : 0;

  return (
    <div>
      <Link href="/business/campaigns" className="inline-flex items-center gap-1 text-sm text-white/50 hover:text-white mb-4">
        <ChevronLeft size={16} /> Terug naar campagnes
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold mb-1">{campaign.name}</h1>
          <p className="text-white/50 text-sm">
            {campaign.objective} · {formatDate(campaign.startDate)} – {formatDate(campaign.endDate)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <MetricCard label="Budget" value={formatEuro(campaign.totalBudget)} />
        <MetricCard label="Impressions" value={formatNumber(totals.impressions)} />
        <MetricCard label="Completion rate" value={formatPercent(completionRate)} />
        <MetricCard label="Unieke kijkers" value={formatNumber(totals.uniqueDevices)} />
        <MetricCard label="Likes" value={formatNumber(totals.likes)} />
        <MetricCard label="Saves" value={formatNumber(totals.saves)} />
        <MetricCard label="Clicks naar winkel" value={formatNumber(totals.clicks)} />
        <MetricCard label="Volledig bekeken" value={formatNumber(totals.completed)} />
      </div>

      <ChartContainer title="Impressions over tijd" subtitle="Echte weergaves van testers">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={viewSeries} margin={{ left: -20, top: 8, right: 8 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke="rgba(255,255,255,0.3)" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip contentStyle={{ background: "#1A1D2E", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12 }} />
            <Line type="monotone" dataKey="value" stroke="#FF3EDB" strokeWidth={2.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </ChartContainer>

      <div className="mt-4">
        <ChartContainer title="Engagement signals" height={200}>
          <div className="flex h-full flex-col justify-center gap-4">
            {[
              { icon: Heart, label: "Like", value: totals.impressions > 0 ? (totals.likes / totals.impressions) * 100 : 0 },
              { icon: Bookmark, label: "Save", value: totals.impressions > 0 ? (totals.saves / totals.impressions) * 100 : 0 },
              { icon: MousePointerClick, label: "Product click", value: totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0 },
            ].map((row) => (
              <div key={row.label} className="flex items-center gap-3">
                <row.icon size={16} className="text-white/40 shrink-0" />
                <span className="text-sm w-28">{row.label}</span>
                <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-violet to-magenta" style={{ width: `${Math.min(100, row.value * 4)}%` }} />
                </div>
                <span className="text-sm font-semibold tabular-nums w-12 text-right">{row.value.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </ChartContainer>
      </div>

      {totals.impressions === 0 && (
        <p className="text-sm text-white/40 mt-4">
          Nog geen echte weergaves voor deze campagne. Laat iemand de Swyp-feed openen om &apos;m te zien.
        </p>
      )}
    </div>
  );
}
