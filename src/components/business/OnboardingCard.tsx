import Link from "next/link";
import { Check, Clock, TriangleAlert } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { onboardingProgress, type OnboardingStep } from "@/lib/onboarding";
import { cn } from "@/lib/utils";

function Marker({ state }: { state: OnboardingStep["state"] }) {
  const base = "flex h-6 w-6 shrink-0 items-center justify-center rounded-full";
  if (state === "done") return <span className={cn(base, "bg-emerald-500/20 text-emerald-300")}><Check size={14} aria-hidden /></span>;
  if (state === "waiting") return <span className={cn(base, "bg-yellow-500/20 text-yellow-300")}><Clock size={13} aria-hidden /></span>;
  if (state === "problem") return <span className={cn(base, "bg-red-500/20 text-red-300")}><TriangleAlert size={13} aria-hidden /></span>;
  return <span className={cn(base, "border border-white/20")} />;
}

const stateLabel: Record<OnboardingStep["state"], string> = { done: "klaar", todo: "nog te doen", waiting: "in behandeling", problem: "aandacht nodig" };

/** Stappenkaart voor een nieuw bedrijf. Verdwijnt zodra alles klaar is. */
export function OnboardingCard({ steps }: { steps: OnboardingStep[] }) {
  const { done, total, complete } = onboardingProgress(steps);
  if (complete) return null;
  const next = steps.find((s) => s.state === "todo" || s.state === "problem");

  return (
    <Card className="mb-6 p-5" aria-labelledby="onboarding-title">
      <div className="mb-1 flex items-baseline justify-between gap-3">
        <h2 id="onboarding-title" className="font-heading text-lg font-bold">Aan de slag</h2>
        <span className="text-xs tabular-nums text-white/45">{done} van {total} klaar</span>
      </div>
      <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={done}>
        <div className="h-full rounded-full bg-gradient-to-r from-violet to-magenta transition-[width]" style={{ width: `${(done / total) * 100}%` }} />
      </div>
      <ol className="grid gap-3">
        {steps.map((s) => (
          <li key={s.id} className="flex items-start gap-3">
            <Marker state={s.state} />
            <div className="min-w-0 flex-1">
              <p className={cn("text-sm font-semibold", s.state === "done" && "text-white/50")}>
                {s.title}
                <span className="sr-only"> ({stateLabel[s.state]})</span>
              </p>
              {s.state !== "done" && <p className="text-xs leading-relaxed text-white/55">{s.text}</p>}
            </div>
            {s === next && s.href && (
              <Link
                href={s.href}
                className="shrink-0 rounded-full bg-gradient-to-r from-violet to-magenta px-3.5 py-1.5 text-xs font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                {s.action}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </Card>
  );
}
