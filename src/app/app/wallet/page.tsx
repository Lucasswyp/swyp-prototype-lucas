"use client";

import { TopBar } from "@/components/consumer/TopBar";
import { SwypToken } from "@/components/ui/SwypToken";
import { Card } from "@/components/ui/Card";
import { TimeAgo } from "@/components/ui/TimeAgo";
import { formatTokens, formatEuro, cn } from "@/lib/utils";
import { useWallet } from "@/contexts/WalletContext";

export default function WalletPage() {
  const { balance: tokenBalance, history: walletHistory } = useWallet();

  const now = new Date();
  const monthEarned = walletHistory
    .filter((t) => t.amount > 0 && new Date(t.createdAt).getMonth() === now.getMonth())
    .reduce((sum, t) => sum + t.amount, 0);

  const savedMoney = walletHistory
    .filter((t) => t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount) * 0.04, 0);

  return (
    <div className="min-h-full pb-28">
      <TopBar title="Wallet" back />

      <div className="px-4 pt-2">
        <Card className="p-5 mb-4 bg-gradient-to-br from-violet/25 to-magenta/10 border-white/15">
          <p className="text-xs uppercase tracking-wide text-white/50 mb-1">Mijn Swyp Tokens</p>
          <div className="flex items-center gap-2 mb-4">
            <SwypToken size={28} />
            <span className="font-heading text-4xl font-extrabold tabular-nums">{formatTokens(tokenBalance)}</span>
          </div>
          <div className="flex gap-6">
            <div>
              <p className="text-[11px] text-white/40">Deze maand verdiend</p>
              <p className="font-semibold text-emerald-300">+{formatTokens(monthEarned)}</p>
            </div>
            <div>
              <p className="text-[11px] text-white/40">Bespaard</p>
              <p className="font-semibold">{formatEuro(savedMoney)}</p>
            </div>
          </div>
        </Card>

        <h2 className="font-heading font-bold text-sm mb-3 text-white/50 uppercase tracking-wide">
          Token history
        </h2>
        <div className="flex flex-col gap-2">
          {walletHistory.map((t) => (
            <div
              key={t.id}
              className="flex items-center justify-between rounded-xl bg-white/[0.03] border border-white/8 px-3.5 py-3"
            >
              <div>
                <p className="text-sm font-medium">{t.reason}</p>
                <p className="text-xs text-white/35">
                  <TimeAgo iso={t.createdAt} />
                </p>
              </div>
              <span
                className={cn(
                  "font-semibold tabular-nums text-sm",
                  t.amount >= 0 ? "text-emerald-300" : "text-white/60"
                )}
              >
                {t.amount >= 0 ? "+" : ""}
                {formatTokens(t.amount)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
