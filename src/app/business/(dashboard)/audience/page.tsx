"use client";

import { useEffect, useState } from "react";
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Users, ShieldCheck } from "lucide-react";
import { ChartContainer } from "@/components/business/ChartContainer";
import { Card } from "@/components/ui/Card";
import { fetchAudienceSummary, type AudienceSummary } from "@/lib/data";

const tooltipStyle = { background: "#1A1D2E", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12 };

export default function AudiencePage() {
  const [summary, setSummary] = useState<AudienceSummary | null | undefined>(undefined);

  useEffect(() => {
    fetchAudienceSummary()
      .then(setSummary)
      .catch(() => setSummary(null));
  }, []);

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold mb-1">Audience</h1>
      <p className="text-white/50 text-sm mb-6">Wie bereik je met je video&apos;s: echte kijkers die iets met je video&apos;s deden.</p>

      {summary === undefined && (
        <Card className="p-8 text-center">
          <p className="text-sm text-white/50">Laden...</p>
        </Card>
      )}

      {summary === null && (
        <Card className="p-8 text-center">
          <p className="text-sm text-white/50">De doelgroepcijfers zijn nu niet te laden. Probeer het later opnieuw.</p>
        </Card>
      )}

      {summary && (
        <>
          <Card className="mb-4 flex items-center gap-3 p-4">
            <Users size={20} className="text-white/40" />
            <div>
              <p className="text-xs text-white/40">Betrokken kijkers</p>
              <p className="text-lg font-semibold tabular-nums">{summary.engaged}</p>
            </div>
          </Card>

          {!summary.enough ? (
            <Card className="p-6">
              <p className="mb-1 text-sm font-semibold">Nog te weinig kijkers voor een verdeling</p>
              <p className="text-sm text-white/55">
                Vanaf {summary.minimum} betrokken kijkers tonen we de verdeling naar leeftijd en geslacht. Je hebt er nu {summary.engaged}. Zo blijft
                het voor kijkers onmogelijk om iemand in de cijfers te herkennen.
              </p>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                <div className="h-full bg-gradient-to-r from-violet to-magenta" style={{ width: `${Math.min(100, (summary.engaged / summary.minimum) * 100)}%` }} />
              </div>
            </Card>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              <ChartContainer title="Leeftijd" subtitle="Aantal kijkers per leeftijdsgroep">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={summary.age.map((g) => ({ name: g.label, value: g.count }))} margin={{ left: -20, top: 8, right: 8 }}>
                    <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                    <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis allowDecimals={false} stroke="rgba(255,255,255,0.3)" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]} fill="#7B3DFF" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>

              <ChartContainer title="Geslacht" subtitle="Aantal kijkers per groep">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={summary.gender.map((g) => ({ name: g.label, value: g.count }))} layout="vertical" margin={{ left: 16, top: 8, right: 24 }}>
                    <CartesianGrid stroke="rgba(255,255,255,0.06)" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} stroke="rgba(255,255,255,0.3)" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis type="category" dataKey="name" stroke="rgba(255,255,255,0.5)" fontSize={12} tickLine={false} axisLine={false} width={80} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="value" radius={[0, 8, 8, 0]} fill="#FF3EDB" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          )}

          <p className="mt-6 flex items-start gap-1.5 text-xs text-white/35">
            <ShieldCheck size={13} className="mt-0.5 shrink-0" />
            Privacy: je ziet alleen aantallen, nooit wie het zijn. Groepen kleiner dan 5 worden samengevoegd onder &ldquo;Overig&rdquo;. Interesses, apparaten en
            kijktijden volgen zodra we daar betrouwbare gegevens over hebben.
          </p>
        </>
      )}
    </div>
  );
}
