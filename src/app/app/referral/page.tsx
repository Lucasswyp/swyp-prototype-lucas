"use client";

import { useEffect, useState } from "react";
import { Gift, Copy, Share2, Check, Users } from "lucide-react";
import { TopBar } from "@/components/consumer/TopBar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { SwypToken } from "@/components/ui/SwypToken";
import { fetchReferralStats, referralLink } from "@/lib/referral";

export default function ReferralPage() {
  const [code, setCode] = useState<string | null>(null);
  const [referredCount, setReferredCount] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchReferralStats()
      .then((stats) => {
        setCode(stats.referralCode);
        setReferredCount(stats.referredCount);
      })
      .catch(() => {});
  }, []);

  const link = code ? referralLink(code) : "";

  async function handleShare() {
    if (!link) return;
    const text = `Swipe met mij mee op Swyp en we krijgen allebei 50 gratis Swyp Tokens: ${link}`;
    if (navigator.share) {
      try {
        await navigator.share({ text, url: link });
        return;
      } catch {
        // User cancelled the native share sheet — fall through to copy.
      }
    }
    await handleCopy();
  }

  async function handleCopy() {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="min-h-full pb-28">
      <TopBar title="Nodig vrienden uit" back />

      <div className="px-4">
        <Card className="p-6 mb-4 text-center bg-gradient-to-br from-violet/25 to-magenta/15 border-white/15">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet to-magenta glow-violet">
            <Gift size={28} />
          </div>
          <h1 className="font-heading text-xl font-extrabold mb-1.5">
            Geef 50, krijg 50 Swyp Tokens
          </h1>
          <p className="text-sm text-white/60 max-w-[280px] mx-auto leading-relaxed">
            Nodig een vriend uit met jouw link. Zodra die zich aanmeldt, krijgen jullie er allebei{" "}
            <span className="text-white font-semibold">50 Swyp Tokens</span> bij.
          </p>
        </Card>

        <Card className="p-4 mb-4">
          <p className="text-xs text-white/40 mb-2">Jouw link</p>
          <div className="flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 mb-3">
            <span className="flex-1 text-sm text-white/70 truncate">{link || "..."}</span>
            <button onClick={handleCopy} aria-label="Kopiëren" disabled={!link}>
              {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} className="text-white/50" />}
            </button>
          </div>
          <Button fullWidth size="lg" onClick={handleShare} disabled={!link} className="gap-2">
            <Share2 size={18} /> Deel je link
          </Button>
        </Card>

        <Card className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5">
              <Users size={17} className="text-white/60" />
            </div>
            <div>
              <p className="text-sm font-semibold">Vrienden uitgenodigd</p>
              <p className="text-xs text-white/40">die zich al hebben aangemeld</p>
            </div>
          </div>
          <span className="font-heading font-extrabold text-lg">{referredCount}</span>
        </Card>

        {referredCount > 0 && (
          <p className="text-xs text-white/40 text-center mt-3 flex items-center justify-center gap-1">
            <SwypToken size={12} /> Al {referredCount * 50} Tokens verdiend via vrienden
          </p>
        )}
      </div>
    </div>
  );
}
