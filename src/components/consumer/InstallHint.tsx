"use client";

import { useState } from "react";
import Link from "next/link";
import { Share, X } from "lucide-react";
import { readEnv, readSnooze, shouldShowInstallHint, snoozeInstallHint } from "@/lib/installHint";

/** Eén keer een vriendelijke tip op een iPhone in Safari: zet Swyp op je beginscherm. */
export function InstallHint({ ready }: { ready: boolean }) {
  const [dismissed, setDismissed] = useState(false);
  // Pas bepalen op het moment dat de tip aan de beurt is, zodat de server er niets over hoeft te weten.
  const [allowed] = useState(() => (typeof window === "undefined" ? false : shouldShowInstallHint(readEnv(), readSnooze(), Date.now())));

  if (!ready || !allowed || dismissed) return null;

  return (
    <div
      role="region"
      aria-label="Tip: Swyp op je beginscherm"
      className="absolute left-3 right-3 top-[calc(env(safe-area-inset-top)+56px)] z-30 flex items-center gap-3 rounded-2xl border border-white/15 bg-slate/95 px-3.5 py-2.5 shadow-xl backdrop-blur"
    >
      <Share size={18} className="shrink-0 text-white/70" aria-hidden />
      <p className="min-w-0 flex-1 text-xs leading-snug text-white/85">
        Zet Swyp op je beginscherm en open het als een gewone app.{" "}
        <Link href="/installeren" className="font-semibold underline">Hoe?</Link>
      </p>
      <button
        type="button"
        aria-label="Niet meer tonen"
        onClick={() => {
          snoozeInstallHint(Date.now());
          setDismissed(true);
        }}
        className="shrink-0 rounded-full p-1.5 text-white/60 hover:bg-white/10 hover:text-white"
      >
        <X size={16} />
      </button>
    </div>
  );
}
