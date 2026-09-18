"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { TokenBadge } from "@/components/ui/TokenBadge";
import { useBusiness } from "@/contexts/BusinessContext";
import { useData } from "@/contexts/DataContext";
import { createReward } from "@/lib/data";
import { formatDate } from "@/lib/utils";
import type { RewardCategory } from "@/types";

const categories: RewardCategory[] = [
  "Populair",
  "Eten & drinken",
  "Fashion",
  "Dagjes uit",
  "Travel",
  "Entertainment",
  "Fitness",
  "Beauty",
  "Tech",
];

const emptyForm = {
  title: "",
  description: "",
  imageUrl: "https://images.unsplash.com/photo-1611817757591-c3f345024273?w=800&q=80&auto=format&fit=crop",
  category: "Fashion" as RewardCategory,
  tokenCost: 150,
  moneyValue: undefined as number | undefined,
  terms: "",
  stock: 100,
  startDate: new Date().toISOString().slice(0, 10),
  endDate: new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10),
  redemptionMethod: "code" as "code" | "qr",
};

export default function BusinessRewardsPage() {
  const { businessId } = useBusiness();
  const { rewards: allRewards, refresh } = useData();
  const rewards = useMemo(() => allRewards.filter((r) => r.companyId === businessId), [allRewards, businessId]);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  async function publish() {
    setSaving(true);
    try {
      await createReward(businessId, form);
      refresh();
      setOpen(false);
      setForm(emptyForm);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold mb-1">Rewards</h1>
          <p className="text-white/50 text-sm">Rewards die je aanbiedt verschijnen direct in de consumenten-app.</p>
        </div>
        <Button className="gap-1.5" onClick={() => setOpen(true)}>
          <Plus size={16} /> Nieuwe reward
        </Button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {rewards.map((r) => (
          <Card key={r.id} className="overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={r.imageUrl} alt={r.title} className="w-full aspect-[16/10] object-cover" />
            <div className="p-4">
              <p className="font-semibold text-sm mb-1">{r.title}</p>
              <p className="text-xs text-white/40 mb-2">Geldig t/m {formatDate(r.endDate)}</p>
              <div className="flex items-center justify-between">
                <TokenBadge amount={r.tokenCost} size="sm" />
                <span className="text-xs text-white/40">{r.stock} beschikbaar</span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Nieuwe reward">
        <div className="flex flex-col gap-3">
          <div>
            <label className="block text-xs font-medium mb-1.5 text-white/60">Titel</label>
            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="bv. 15% korting"
              className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm outline-none focus:border-violet"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5 text-white/60">Omschrijving</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={2}
              className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm outline-none focus:border-violet"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1.5 text-white/60">Token cost</label>
              <input
                type="number"
                value={form.tokenCost}
                onChange={(e) => setForm((f) => ({ ...f, tokenCost: Number(e.target.value) }))}
                className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm outline-none focus:border-violet"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5 text-white/60">Voorraad</label>
              <input
                type="number"
                value={form.stock}
                onChange={(e) => setForm((f) => ({ ...f, stock: Number(e.target.value) }))}
                className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm outline-none focus:border-violet"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5 text-white/60">Categorie</label>
            <select
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as RewardCategory }))}
              className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm outline-none focus:border-violet"
            >
              {categories.map((c) => (
                <option key={c} value={c} className="bg-slate">
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1.5 text-white/60">Startdatum</label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm outline-none focus:border-violet"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5 text-white/60">Einddatum</label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm outline-none focus:border-violet"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5 text-white/60">Voorwaarden</label>
            <input
              value={form.terms}
              onChange={(e) => setForm((f) => ({ ...f, terms: e.target.value }))}
              className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm outline-none focus:border-violet"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5 text-white/60">Redemption method</label>
            <div className="flex gap-2">
              {(["code", "qr"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setForm((f) => ({ ...f, redemptionMethod: m }))}
                  className={`rounded-full px-4 py-1.5 text-sm border ${
                    form.redemptionMethod === m ? "bg-white text-indigo border-transparent" : "border-white/15 text-white/60"
                  }`}
                >
                  {m === "code" ? "Kortingscode" : "QR-code"}
                </button>
              ))}
            </div>
          </div>
          <Button fullWidth className="mt-2" disabled={!form.title || saving} onClick={publish}>
            {saving ? "Bezig..." : "Publiceer reward"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
