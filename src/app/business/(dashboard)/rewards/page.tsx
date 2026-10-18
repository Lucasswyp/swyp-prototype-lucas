"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { TokenBadge } from "@/components/ui/TokenBadge";
import { useBusiness } from "@/contexts/BusinessContext";
import { useData } from "@/contexts/DataContext";
import { createReward, addRewardCodes, fetchRewardCodeCounts, checkRedemptionCode, type CodeCheck } from "@/lib/data";
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

  const [counts, setCounts] = useState<Record<string, { available: number; claimed: number }>>({});
  const [codesFor, setCodesFor] = useState<string | null>(null);
  const [codesText, setCodesText] = useState("");
  const [codesBusy, setCodesBusy] = useState(false);
  const [codesMsg, setCodesMsg] = useState<string | null>(null);
  const [checkInput, setCheckInput] = useState("");
  const [checkResult, setCheckResult] = useState<CodeCheck | null>(null);
  const [checkBusy, setCheckBusy] = useState(false);

  function loadCounts() {
    fetchRewardCodeCounts().then(setCounts).catch(() => {});
  }
  useEffect(() => {
    fetchRewardCodeCounts().then(setCounts).catch(() => {});
  }, []);

  async function uploadCodes() {
    if (!codesFor) return;
    setCodesBusy(true);
    setCodesMsg(null);
    try {
      const { added, skipped } = await addRewardCodes(codesFor, codesText);
      setCodesMsg(`${added} codes toegevoegd${skipped ? `, ${skipped} overgeslagen (dubbel of ongeldig)` : ""}.`);
      setCodesText("");
      loadCounts();
    } catch (e) {
      setCodesMsg(e instanceof Error ? e.message : "Uploaden is mislukt.");
    } finally {
      setCodesBusy(false);
    }
  }

  async function runCheck(markUsed: boolean) {
    if (!checkInput.trim()) return;
    setCheckBusy(true);
    try {
      setCheckResult(await checkRedemptionCode(checkInput, markUsed));
    } catch {
      setCheckResult(null);
    } finally {
      setCheckBusy(false);
    }
  }

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

      <Card className="p-4 mb-6">
        <p className="text-sm font-bold mb-1">Code controleren</p>
        <p className="text-xs text-white/50 mb-3">
          Typ de code die een klant laat zien. Je ziet of hij geldig is en kunt hem direct als gebruikt markeren.
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            id="check-code"
            aria-label="Kortingscode"
            value={checkInput}
            onChange={(e) => {
              setCheckInput(e.target.value);
              setCheckResult(null);
            }}
            placeholder="bv. SWYP-AB12CD"
            className="flex-1 rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm font-mono uppercase outline-none focus:border-violet"
          />
          <Button size="sm" variant="secondary" disabled={checkBusy || !checkInput.trim()} onClick={() => runCheck(false)}>
            Controleer
          </Button>
          <Button
            size="sm"
            disabled={checkBusy || !checkInput.trim() || checkResult === null || !checkResult.found || checkResult.status !== "active"}
            onClick={() => runCheck(true)}
          >
            Markeer als gebruikt
          </Button>
        </div>
        {checkResult && (
          <p
            className={`mt-3 text-sm ${
              !checkResult.found
                ? "text-red-300"
                : checkResult.status === "active"
                  ? "text-emerald-300"
                  : "text-yellow-300"
            }`}
          >
            {!checkResult.found
              ? "Deze code is niet gevonden bij jouw rewards."
              : checkResult.status === "active"
                ? `Geldig: ${checkResult.title}. Nog niet gebruikt.`
                : checkResult.status === "used_now"
                  ? `Gemarkeerd als gebruikt: ${checkResult.title}.`
                  : `Deze code is al gebruikt (${checkResult.title}).`}
          </p>
        )}
      </Card>

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
                <span className="text-xs text-white/40">
                  {counts[r.id]
                    ? `${counts[r.id].available} codes over, ${counts[r.id].claimed} gebruikt`
                    : `${r.stock} beschikbaar`}
                </span>
              </div>
              <Button
                size="sm"
                variant="secondary"
                className="mt-3"
                onClick={() => {
                  setCodesFor(r.id);
                  setCodesMsg(null);
                }}
              >
                Eigen codes uploaden
              </Button>
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

      <Modal open={codesFor !== null} onClose={() => setCodesFor(null)} title="Eigen kortingscodes uploaden">
        <div className="flex flex-col gap-3">
          <p className="text-xs text-white/50">
            Plak je codes, één per regel (komma of puntkomma mag ook). Elke klant krijgt een eigen code uit deze lijst.
            Zijn alle codes op, dan kan de reward niet meer worden ingewisseld tot je nieuwe uploadt.
          </p>
          <textarea
            id="codes-text"
            aria-label="Kortingscodes"
            rows={8}
            value={codesText}
            onChange={(e) => setCodesText(e.target.value)}
            placeholder={"ZOMER10-A1B2\nZOMER10-C3D4"}
            className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm font-mono outline-none focus:border-violet"
          />
          {codesMsg && <p className="text-sm text-white/70">{codesMsg}</p>}
          <Button fullWidth disabled={codesBusy || !codesText.trim()} onClick={uploadCodes}>
            {codesBusy ? "Bezig..." : "Codes toevoegen"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
