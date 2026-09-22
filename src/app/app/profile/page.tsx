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
  Flame,
  Pencil,
} from "lucide-react";
import { TopBar } from "@/components/consumer/TopBar";
import { Card } from "@/components/ui/Card";
import { formatTokens, formatEuro } from "@/lib/utils";
import { useWallet } from "@/contexts/WalletContext";
import { fetchMyProfile } from "@/lib/profile";
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
  const [username, setUsername] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
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
    fetchMyProfile().then((profile) => {
      if (!profile) return;
      setName(profile.name);
      setUsername(profile.username);
      setAvatarUrl(profile.avatarUrl);
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
          <div className="relative h-16 w-16 rounded-full overflow-hidden bg-gradient-to-br from-violet to-magenta flex items-center justify-center font-heading text-xl font-extrabold shrink-0">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              name.charAt(0).toUpperCase()
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-heading font-bold text-lg truncate">{name}</p>
            <p className="text-xs text-white/40">{username ? `@${username}` : "Swyp-lid"}</p>
          </div>
          <Link
            href="/app/profile/edit"
            aria-label="Profiel bewerken"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 border border-white/10 shrink-0"
          >
            <Pencil size={15} />
          </Link>
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
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-3 hover:bg-white/5 text-sm text-red-300"
        >
          <LogOut size={18} /> Uitloggen
        </button>
      </div>
    </div>
  );
}
