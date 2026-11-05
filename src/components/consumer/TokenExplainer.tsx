import { EARN_LINES } from "@/lib/tokenInfo";
import { SwypToken } from "@/components/ui/SwypToken";

/** Korte uitleg: wat verdien je waarmee, en wat doe je met tokens. */
export function TokenExplainer({ compact = false }: { compact?: boolean }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-left">
      <p className="mb-2 text-sm font-semibold">Zo verdien je Swyp Tokens</p>
      <ul className="mb-3 grid gap-1.5">
        {EARN_LINES.map((l) => (
          <li key={l.label} className="flex items-center justify-between gap-3 text-sm text-white/75">
            <span>{l.label}</span>
            <span className="flex shrink-0 items-center gap-1 font-semibold tabular-nums text-white">
              +{l.tokens} <SwypToken size={14} />
            </span>
          </li>
        ))}
      </ul>
      <p className="text-xs leading-relaxed text-white/60">
        {compact
          ? "1 token is €0,01 waard. Wissel ze in bij Rewards voor een korting van een bedrijf."
          : "1 token is €0,01 waard. Bij Rewards wissel je tokens in voor een korting van een bedrijf: je laat de code zien bij het afrekenen. Tokens hebben buiten Swyp geen geldwaarde."}
      </p>
    </div>
  );
}
