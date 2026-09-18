"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { Eye, MousePointerClick, Heart, Bookmark, Smartphone, Ticket } from "lucide-react";
import { MetricCard } from "@/components/business/MetricCard";
import { ChartContainer } from "@/components/business/ChartContainer";
import { useBusiness } from "@/contexts/BusinessContext";
import { useData } from "@/contexts/DataContext";
import { fetchInteractionsForBusiness, fetchRedemptionsForBusiness, computeAnalytics, type Interaction } from "@/lib/data";
import { formatNumber, formatPercent } from "@/lib/utils";
import { dailySeries } from "@/lib/chartData";

export default function BusinessOverviewPage() {
  const { businessId, business } = useBusiness();
  const { ads } = useData();
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [redemptionCount, setRedemptionCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [inter, redemptions] = await Promise.all([
        fetchInteractionsForBusiness(businessId),
        fetchRedemptionsForBusiness(businessId),
      ]);
      if (cancelled) return;
      setInteractions(inter);
      setRedemptionCount(redemptions.length);
      setLoading(false);
    }
    load();
    const interval = setInterval(load, 15000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [businessId]);

  const totals = useMemo(() => computeAnalytics(interactions), [interactions]);
  const ownAdsCount = ads.filter((a) => a.companyId === businessId).length;

  const completionRate = totals.impressions > 0 ? (totals.watch80 / totals.impressions) * 100 : 0;
  const engagementRate = totals.impressions > 0 ? ((totals.likes + totals.saves) / totals.impressions) * 100 : 0;

  const viewSeries = useMemo(() => {
    const days = dailySeries(0).map((d) => ({ ...d, value: 0 }));
    interactions
      .filter((i) => i.event_name === "impression")
      .forEach((i) => {
        const label = new Date(i.created_at).toLocaleDateString("nl-NL", { day: "numeric", month: "short" });
        const day = days.find((d) => d.date === label);
        if (day) day.value += 1;
      });
    return days;
  }, [interactions]);

  return (
    <div>
      <div className="mb-7 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold mb-1">Goedemiddag, {business.name}</h1>
          <p className="text-white/50 text-sm">
            Live data van echte Swyp-gebruikers — {ownAdsCount} actieve advertentie{ownAdsCount === 1 ? "" : "s"}.
          </p>
        </div>
        {loading && <span className="text-xs text-white/30">laden...</span>}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <MetricCard label="Impressions" value={formatNumber(totals.impressions)} icon={Eye} />
        <MetricCard label="Unieke kijkers" value={formatNumber(totals.uniqueDevices)} icon={Smartphone} />
        <MetricCard label="Completion rate" value={formatPercent(completionRate)} icon={Eye} />
        <MetricCard label="Engagement" value={formatPercent(engagementRate)} icon={Heart} />
        <MetricCard label="Likes" value={formatNumber(totals.likes)} icon={Heart} />
        <MetricCard label="Saves" value={formatNumber(totals.saves)} icon={Bookmark} />
        <MetricCard label="Clicks naar winkel" value={formatNumber(totals.clicks)} icon={MousePointerClick} />
        <MetricCard label="Rewards ingewisseld" value={formatNumber(redemptionCount)} icon={Ticket} />
      </div>

      <ChartContainer title="Impressions over tijd" subtitle="Laatste 14 dagen, echte kijkers">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={viewSeries} margin={{ left: -20, top: 8, right: 8 }}>
            <defs>
              <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#7B3DFF" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#7B3DFF" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke="rgba(255,255,255,0.3)" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip contentStyle={{ background: "#1A1D2E", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12 }} />
            <Area type="monotone" dataKey="value" stroke="#7B3DFF" fill="url(#viewsGrad)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartContainer>

      {totals.impressions === 0 && !loading && (
        <p className="text-sm text-white/40 mt-6">
          Nog geen weergaves. Zodra iemand jouw advertentie in de Swyp-feed bekijkt, verschijnen hier live cijfers.
        </p>
      )}
    </div>
  );
}
