"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Heart,
  Ticket,
  Wallet,
  Bookmark,
  Users,
  Bell,
  Lock,
  Settings,
  HelpCircle,
  LogOut,
  RotateCcw,
  Flame,
} from "lucide-react";
import { TopBar } from "@/components/consumer/TopBar";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { formatTokens, formatEuro } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";
import { useWallet } from "@/contexts/WalletContext";
import { createClient } from "@/lib/supabase/client";

const menu = [
  { icon: Heart, label: "Mijn interesses", href: "/app/interests" },
  { icon: Ticket, label: "Mijn rewards", href: "/app/my-rewards" },
  { icon: Wallet, label: "Wallet", href: "/app/wallet" },
  { icon: Bookmark, label: "Saved", href: "/app/saved" },
  { icon: Users, label: "Following", href: "/app/saved" },
  { icon: Bell, label: "Meldingen", href: "#" },
  { icon: Lock, label: "Privacy", href: "#" },
  { icon: Settings, label: "Instellingen", href: "#" },
  { icon: HelpCircle, label: "Help", href: "#" },
];

export default function ProfilePage() {
  const router = useRouter();
  const [name, setName] = useState("Swyp-gebruiker");
  const challenges = useAppStore((s) => s.challenges);
  const resetDemo = useAppStore((s) => s.resetDemo);
  const {
    balance: tokenBalance,
    currentStreak,
    freezesAvailable,
    history: walletHistory,
    redemptions,
    followedCompanyIds,
    savedProductIds,
  } = useWallet();

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("consumers")
      .select("name")
      .maybeSingle()
      .then(({ data }) => {
        if (data?.name) setName(data.name);
      });
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/get-started");
    router.refresh();
  }

  const totalSaved = walletHistory
    .filter((t) => t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount) * 0.01, 0);

  return (
    <div className="min-h-full pb-28">
      <TopBar title="Profiel" />

      <div className="px-4">
        <Card className="p-5 mb-4 flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-gradient-to-br from-violet to-magenta flex items-center justify-center font-heading text-xl font-extrabold shrink-0">
            {name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-heading font-bold text-lg truncate">{name}</p>
            <p className="text-xs text-white/40">Swyp-lid</p>
          </div>
        </Card>

        <div className="grid grid-cols-3 gap-2.5 mb-4">
          <Card className="p-3 text-center">
            <p className="font-heading font-bold text-lg">{formatTokens(tokenBalance)}</p>
            <p className="text-[10px] text-white/40 mt-0.5">Tokens</p>
          </Card>
          <Card className="p-3 text-center">
            <p className="font-heading font-bold text-lg">{savedProductIds.size}</p>
            <p className="text-[10px] text-white/40 mt-0.5">Saved</p>
          </Card>
          <Card className="p-3 text-center">
            <p className="font-heading font-bold text-lg">{redemptions.length}</p>
            <p className="text-[10px] text-white/40 mt-0.5">Rewards</p>
          </Card>
        </div>

        <Card className="p-4 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame size={20} className="text-orange-400" />
            <div>
              <p className="text-sm font-semibold">Streak</p>
              <p className="text-xs text-white/40">
                {freezesAvailable > 0 ? "1 gratis freeze beschikbaar bij een gemiste dag" : "Blijf swipen om 'm te behouden"}
              </p>
            </div>
          </div>
          <span className="font-heading font-extrabold text-lg">{currentStreak}d</span>
        </Card>

        <Card className="p-4 mb-4">
          <p className="text-xs text-white/40 mb-1">Totale besparing</p>
          <p className="font-heading text-xl font-extrabold">{formatEuro(totalSaved)}</p>
        </Card>

        <h2 className="font-heading font-bold text-sm mb-2.5 text-white/50 uppercase tracking-wide">
          Challenges
        </h2>
        <div className="flex flex-col gap-2 mb-6">
          {challenges.map((c) => (
            <Card key={c.id} className="p-3.5">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-sm font-medium">{c.title}</p>
                <span className="text-xs text-white/40 tabular-nums">
                  {c.progress}/{c.target}
                </span>
              </div>
              <ProgressBar value={c.progress} max={c.target} />
              <p className="text-[11px] text-magenta mt-1.5 font-semibold">+{c.rewardTokens} Tokens</p>
            </Card>
          ))}
        </div>

        <div className="flex flex-col gap-1 mb-6">
          {menu.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="flex items-center gap-3 rounded-xl px-3 py-3 hover:bg-white/5 text-sm"
            >
              <item.icon size={18} className="text-white/50" />
              {item.label}
              {item.label === "Following" && (
                <span className="ml-auto text-xs text-white/30">
                  {followedCompanyIds.size}
                </span>
              )}
            </Link>
          ))}
        </div>

        <button
          onClick={() => {
            if (confirm("Weet je zeker dat je de demo wilt resetten? Alle voortgang gaat verloren.")) {
              resetDemo();
            }
          }}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-3 hover:bg-white/5 text-sm text-white/60"
        >
          <RotateCcw size={18} /> Demo Mode: reset voortgang
        </button>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-3 hover:bg-white/5 text-sm text-red-300"
        >
          <LogOut size={18} /> Uitloggen
        </button>
      </div>
    </div>
  );
}
