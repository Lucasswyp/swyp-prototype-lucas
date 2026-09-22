"use client";

import Link from "next/link";
import { ChevronLeft, Bell, Flame } from "lucide-react";
import { useRouter } from "next/navigation";
import { TokenBadge } from "@/components/ui/TokenBadge";
import { LogoMark } from "@/components/ui/Logo";
import { useWallet } from "@/contexts/WalletContext";

export function TopBar({
  title,
  back,
  transparent,
}: {
  title?: string;
  back?: boolean;
  transparent?: boolean;
}) {
  const router = useRouter();
  const { balance, currentStreak } = useWallet();

  return (
    <header
      className={`sticky top-0 z-30 flex items-center gap-3 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] ${
        transparent ? "bg-transparent" : "bg-indigo/85 backdrop-blur-xl border-b border-white/5"
      }`}
    >
      {back && (
        <button
          onClick={() => router.back()}
          aria-label="Terug"
          className="rounded-full p-1.5 hover:bg-white/10 -ml-1.5"
        >
          <ChevronLeft size={22} />
        </button>
      )}
      {!back && <LogoMark size={26} />}
      {title && <h1 className="font-heading font-bold text-lg truncate">{title}</h1>}
      <div className="ml-auto flex items-center gap-2">
        {currentStreak > 1 && (
          <Link
            href="/app/profile"
            aria-label={`Streak: ${currentStreak} dagen`}
            className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-1 text-xs font-semibold tabular-nums"
          >
            <Flame size={13} className="text-orange-400" />
            {currentStreak}
          </Link>
        )}
        <Link href="/app/wallet">
          <TokenBadge amount={balance} size="sm" />
        </Link>
        <button aria-label="Meldingen" className="rounded-full p-1.5 hover:bg-white/10">
          <Bell size={20} />
        </button>
      </div>
    </header>
  );
}
