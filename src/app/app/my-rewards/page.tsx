"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Ticket, Copy, QrCode } from "lucide-react";
import { TopBar } from "@/components/consumer/TopBar";
import { Chip } from "@/components/ui/Chip";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate } from "@/lib/utils";
import { useWallet } from "@/contexts/WalletContext";
import { useData } from "@/contexts/DataContext";

const tabs = ["Actief", "Gebruikt", "Verlopen"] as const;

export default function MyRewardsPage() {
  const [tab, setTab] = useState<(typeof tabs)[number]>("Actief");
  const { redemptions, markRedemptionUsed, refreshRedemptions } = useWallet();
  const { rewards: rewardsList } = useData();

  useEffect(() => {
    refreshRedemptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const statusMap = { Actief: "active", Gebruikt: "used", Verlopen: "expired" } as const;
  const filtered = redemptions.filter((r) => r.status === statusMap[tab]);

  return (
    <div className="min-h-full pb-28">
      <TopBar title="Mijn Rewards" back />

      <div className="flex gap-2 px-4 py-3">
        {tabs.map((t) => (
          <Chip key={t} active={tab === t} onClick={() => setTab(t)}>
            {t}
          </Chip>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Ticket}
          title="Nog geen rewards hier"
          description="Wissel Swyp Tokens in voor kortingen, gratis producten en meer bij Rewards."
          action={
            <Link href="/app/rewards">
              <Button>Bekijk Rewards</Button>
            </Link>
          }
        />
      ) : (
        <div className="flex flex-col gap-3 px-4">
          {filtered.map((redemption) => {
            const reward = rewardsList.find((r) => r.id === redemption.rewardId);
            if (!reward) return null;
            return (
              <Card key={redemption.id} className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-heading font-bold text-sm mb-1">{reward.title}</p>
                    <p className="text-xs text-white/40">Ingewisseld op {formatDate(redemption.redeemedAt)}</p>
                  </div>
                  {reward.redemptionMethod === "qr" ? (
                    <QrCode size={22} className="text-white/40" />
                  ) : (
                    <Copy size={18} className="text-white/40" />
                  )}
                </div>

                {redemption.status === "active" && (
                  <>
                    <div className="rounded-lg bg-white/5 border border-dashed border-white/20 px-3 py-2.5 mb-3 flex items-center justify-between">
                      <span className="font-mono text-sm tracking-widest">{redemption.code}</span>
                      <button
                        onClick={() => navigator.clipboard?.writeText(redemption.code)}
                        className="text-xs text-magenta font-semibold"
                      >
                        Kopieer
                      </button>
                    </div>
                    <p className="text-xs text-white/40 mb-3">
                      {reward.redemptionMethod === "qr"
                        ? "Laat deze code zien bij de kassa."
                        : "Kopieer de kortingscode en gebruik deze bij checkout."}
                    </p>
                    <Button size="sm" fullWidth variant="secondary" onClick={() => markRedemptionUsed(redemption.id)}>
                      Markeer als gebruikt
                    </Button>
                  </>
                )}
                {redemption.status === "used" && (
                  <span className="inline-block text-xs font-semibold text-white/40 bg-white/5 rounded-full px-2.5 py-1">
                    Gebruikt
                  </span>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
