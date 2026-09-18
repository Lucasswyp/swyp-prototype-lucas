"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { CheckCircle2 } from "lucide-react";
import { TopBar } from "@/components/consumer/TopBar";
import { TokenBadge } from "@/components/ui/TokenBadge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { CompanyAvatar } from "@/components/ui/CompanyAvatar";
import { formatDate } from "@/lib/utils";
import { useData } from "@/contexts/DataContext";
import { useAppStore } from "@/store/useAppStore";
import { insertRedemption } from "@/lib/data";
import { getDeviceId } from "@/lib/deviceId";

export default function RewardDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { rewards, companies } = useData();
  const reward = rewards.find((r) => r.id === id);
  const tokenBalance = useAppStore((s) => s.tokenBalance);
  const redeemReward = useAppStore((s) => s.redeemReward);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!reward) {
    return (
      <div className="p-6">
        <TopBar back />
        <p className="text-white/50 text-sm">Reward niet gevonden.</p>
      </div>
    );
  }

  const company = companies.find((c) => c.id === reward.companyId);
  const canAfford = tokenBalance >= reward.tokenCost;

  function handleConfirm() {
    const result = redeemReward(reward!);
    if (!result.ok) {
      setError(result.reason ?? "Er ging iets mis");
      setConfirmOpen(false);
      return;
    }
    setConfirmOpen(false);
    setSuccessOpen(true);
    if (result.redemption) {
      insertRedemption(reward!.id, getDeviceId(), result.redemption.code).catch(() => {});
    }
  }

  return (
    <div className="min-h-full pb-28">
      <TopBar back />

      <div className="relative w-full aspect-[16/10]">
        <Image src={reward.imageUrl} alt={reward.title} fill className="object-cover" />
      </div>

      <div className="px-4 pt-4">
        {company && (
          <div className="flex items-center gap-2 mb-3">
            <CompanyAvatar src={company.logoUrl} name={company.name} verified={company.verified} size={26} />
            <span className="text-sm font-medium text-white/70">{company.name}</span>
          </div>
        )}
        <h1 className="font-heading text-xl font-bold mb-2">{reward.title}</h1>
        <p className="text-sm text-white/60 leading-relaxed mb-4">{reward.description}</p>

        <div className="flex items-center gap-3 mb-5">
          <TokenBadge amount={reward.tokenCost} size="lg" />
          {reward.moneyValue && (
            <span className="text-sm text-white/40">t.w.v. €{reward.moneyValue.toFixed(2)}</span>
          )}
        </div>

        <div className="rounded-xl bg-white/[0.03] border border-white/8 p-4 mb-4 space-y-2 text-sm">
          <div className="flex justify-between text-white/50">
            <span>Voorwaarden</span>
          </div>
          <p className="text-white/70">{reward.terms}</p>
          <div className="flex justify-between pt-2 border-t border-white/8 mt-2">
            <span className="text-white/50">Geldig t/m</span>
            <span>{formatDate(reward.endDate)}</span>
          </div>
        </div>

        {error && <p className="text-sm text-red-300 mb-3">{error}</p>}

        <Button fullWidth size="lg" disabled={!canAfford} onClick={() => setConfirmOpen(true)}>
          {canAfford ? `Wissel ${reward.tokenCost} Tokens in` : "Onvoldoende Tokens"}
        </Button>
      </div>

      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Reward inwisselen">
        <p className="text-sm text-white/60 mb-5">
          Je staat op het punt om <strong className="text-white">{reward.title}</strong> in te wisselen voor{" "}
          <strong className="text-white">{reward.tokenCost} Swyp Tokens</strong>. Dit kan niet ongedaan worden gemaakt.
        </p>
        <div className="flex gap-3">
          <Button variant="secondary" fullWidth onClick={() => setConfirmOpen(false)}>
            Annuleren
          </Button>
          <Button fullWidth onClick={handleConfirm}>
            Bevestigen
          </Button>
        </div>
      </Modal>

      <Modal open={successOpen} onClose={() => router.push("/app/my-rewards")} title="">
        <div className="flex flex-col items-center text-center py-2">
          <CheckCircle2 size={48} className="text-emerald-400 mb-4" />
          <h3 className="font-heading text-lg font-bold mb-1.5">Reward ingewisseld!</h3>
          <p className="text-sm text-white/60 mb-6">
            {reward.title} staat klaar in Mijn Rewards. Toon je code bij de aanbieder.
          </p>
          <Button fullWidth onClick={() => router.push("/app/my-rewards")}>
            Bekijk Mijn Rewards
          </Button>
        </div>
      </Modal>
    </div>
  );
}
