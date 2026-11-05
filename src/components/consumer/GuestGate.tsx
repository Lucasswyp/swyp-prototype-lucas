"use client";

import { Lock } from "lucide-react";
import { TopBar } from "@/components/consumer/TopBar";
import { TokenExplainer } from "@/components/consumer/TokenExplainer";
import { useConsumerAuth } from "@/contexts/ConsumerAuthContext";

/** Voor gasten: in plaats van een scherm vol nullen een uitleg en een knop om in te loggen. */
export function GuestGate({ title, back, links }: { title: string; back?: boolean; links?: { label: string; href: string }[] }) {
  const { requireAuth } = useConsumerAuth();
  return (
    <div className="min-h-full pb-28">
      <TopBar title={title} back={back} />
      <div className="flex flex-col gap-5 px-4 pt-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5">
            <Lock size={24} className="text-white/60" aria-hidden />
          </div>
          <h2 className="font-heading text-xl font-bold">Log in om je tokens te bewaren</h2>
          <p className="max-w-xs text-sm text-white/70">
            Als gast kun je gewoon kijken. Met een gratis account verdien je tokens, bewaar je producten en wissel je ze in voor korting.
          </p>
        </div>
        <TokenExplainer />
        <button
          type="button"
          onClick={() => requireAuth()}
          className="w-full rounded-full bg-white py-3 text-sm font-semibold text-indigo"
        >
          Inloggen of account maken
        </button>
        {links && links.length > 0 && (
          <ul className="overflow-hidden rounded-2xl border border-white/10">
            {links.map((l) => (
              <li key={l.href} className="border-b border-white/10 last:border-b-0">
                <a href={l.href} className="flex items-center justify-between px-4 py-3 text-sm text-white/80 hover:bg-white/5">
                  {l.label}
                  <span aria-hidden className="text-white/40">›</span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
