"use client";

import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Users, Smartphone, Clock } from "lucide-react";
import { ChartContainer } from "@/components/business/ChartContainer";
import { Card } from "@/components/ui/Card";

const ageData = [
  { name: "16-17", value: 4 },
  { name: "18-24", value: 42 },
  { name: "25-34", value: 38 },
  { name: "35-44", value: 12 },
  { name: "45+", value: 4 },
];

const interestData = [
  { name: "Fashion", value: 68 },
  { name: "Fitness", value: 44 },
  { name: "Travel", value: 39 },
  { name: "Tech", value: 31 },
  { name: "Food", value: 27 },
];

const deviceData = [
  { name: "Mobiel", value: 91 },
  { name: "Tablet", value: 7 },
  { name: "Desktop", value: 2 },
];

const segments = [
  { name: "High intent shoppers", size: "18.4k", desc: "Klikt vaak door naar productpagina's en rondt aankopen af." },
  { name: "Deal seekers", size: "24.1k", desc: "Reageert sterk op kortingen en rewards met hoge tokenwaarde." },
  { name: "Fashion enthusiasts", size: "31.7k", desc: "Volgt meerdere modemerken en bekijkt collecties volledig." },
  { name: "Frequent savers", size: "12.9k", desc: "Slaat gemiddeld 3x meer op dan de gemiddelde gebruiker." },
  { name: "High-value customers", size: "6.2k", desc: "Top 10% in besteding en Token-inwisseling." },
];

export default function AudiencePage() {
  return (
    <div>
      <h1 className="font-heading text-2xl font-bold mb-1">Audience</h1>
      <p className="text-white/50 text-sm mb-2">Wie bereik je met je campagnes, en hoe gedragen ze zich.</p>
      <span className="inline-block text-[11px] font-semibold text-magenta bg-magenta/10 rounded-full px-2.5 py-1 mb-6">
        Demo data — bij meer testers wordt dit echte segmentatie
      </span>

      <div className="grid lg:grid-cols-2 gap-4 mb-4">
        <ChartContainer title="Leeftijd">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={ageData} margin={{ left: -20, top: 8, right: 8 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="rgba(255,255,255,0.3)" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: "#1A1D2E", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12 }} />
              <Bar dataKey="value" radius={[8, 8, 0, 0]} fill="#7B3DFF" />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>

        <ChartContainer title="Top interesses">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={interestData} layout="vertical" margin={{ left: 16, top: 8, right: 24 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.06)" horizontal={false} />
              <XAxis type="number" stroke="rgba(255,255,255,0.3)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="name" stroke="rgba(255,255,255,0.5)" fontSize={12} tickLine={false} axisLine={false} width={70} />
              <Tooltip contentStyle={{ background: "#1A1D2E", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12 }} />
              <Bar dataKey="value" radius={[0, 8, 8, 0]} fill="#FF3EDB" />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      <div className="grid sm:grid-cols-3 gap-3 mb-6">
        <Card className="p-4 flex items-center gap-3">
          <Smartphone size={20} className="text-white/40" />
          <div>
            <p className="text-xs text-white/40">Devices</p>
            <p className="text-sm font-semibold">{deviceData[0].value}% mobiel</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <Clock size={20} className="text-white/40" />
          <div>
            <p className="text-xs text-white/40">Piekmoment</p>
            <p className="text-sm font-semibold">19:00 – 22:00</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <Users size={20} className="text-white/40" />
          <div>
            <p className="text-xs text-white/40">Bereikte gebruikers</p>
            <p className="text-sm font-semibold">93.3k deze maand</p>
          </div>
        </Card>
      </div>

      <h2 className="font-heading font-bold text-base mb-3">Segmenten</h2>
      <div className="grid sm:grid-cols-2 gap-3">
        {segments.map((s) => (
          <Card key={s.name} className="p-4">
            <div className="flex items-center justify-between mb-1.5">
              <p className="font-semibold text-sm">{s.name}</p>
              <span className="text-xs text-white/40">{s.size}</span>
            </div>
            <p className="text-xs text-white/50 leading-relaxed">{s.desc}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
