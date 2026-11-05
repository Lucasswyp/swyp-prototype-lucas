import { CTA_LABELS, CTA_MAX_LENGTH } from "@/lib/ctaLabels";
import { cn } from "@/lib/utils";

interface Props {
  value: string;
  custom: boolean;
  onPick: (label: string) => void;
  onCustom: () => void;
  onType: (text: string) => void;
}

const chip = (active: boolean) =>
  cn(
    "rounded-full border px-3 py-1.5 text-xs font-semibold",
    active ? "border-transparent bg-white text-indigo" : "border-white/15 text-white/70 hover:border-white/40"
  );

/** Kies de tekst op de knop onder je video uit een korte lijst, of schrijf zelf iets korts. */
export function CtaLabelPicker({ value, custom, onPick, onCustom, onType }: Props) {
  return (
    <div>
      <p id="cta-label-title" className="mb-1.5 text-xs font-medium text-white/60">Tekst op de knop</p>
      <div role="radiogroup" aria-labelledby="cta-label-title" className="flex flex-wrap gap-2">
        {CTA_LABELS.map((l) => {
          const active = !custom && value === l;
          return (
            <button key={l} type="button" role="radio" aria-checked={active} onClick={() => onPick(l)} className={chip(active)}>
              {l}
            </button>
          );
        })}
        <button type="button" role="radio" aria-checked={custom} onClick={onCustom} className={chip(custom)}>
          Eigen tekst
        </button>
      </div>
      {custom && (
        <div className="mt-2">
          <input
            value={value}
            maxLength={CTA_MAX_LENGTH}
            onChange={(e) => onType(e.target.value)}
            aria-label="Eigen tekst op de knop"
            placeholder="bv. Kom proefles doen"
            className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm outline-none focus:border-violet"
          />
          <p className="mt-1 text-xs text-white/55">
            Kort en duidelijk, zonder uitroeptekens. De pijl komt er vanzelf achter. {value.length}/{CTA_MAX_LENGTH}
          </p>
        </div>
      )}
    </div>
  );
}
