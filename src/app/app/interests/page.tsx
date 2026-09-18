"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { interestOptions } from "@/data/seed";
import { useAppStore } from "@/store/useAppStore";
import type { Category } from "@/types";
import { cn } from "@/lib/utils";

export default function InterestsPage() {
  const router = useRouter();
  const setInterests = useAppStore((s) => s.setInterests);
  const completeOnboarding = useAppStore((s) => s.completeOnboarding);
  const [selected, setSelected] = useState<Category[]>(["Fashion", "Food", "Tech"]);

  function toggle(cat: Category) {
    setSelected((s) => (s.includes(cat) ? s.filter((c) => c !== cat) : [...s, cat]));
  }

  function start() {
    setInterests(selected);
    completeOnboarding();
    router.replace("/app");
  }

  return (
    <div className="flex h-full w-full flex-col px-6 pt-16 pb-8">
      <div className="mb-8 text-center">
        <h2 className="font-heading text-2xl font-bold mb-2">Wat vind jij interessant?</h2>
        <p className="text-white/50 text-sm">
          Kies minstens 3 interesses. Dit bepaalt je eerste feed — je kunt dit later altijd aanpassen.
        </p>
      </div>

      <div className="flex flex-wrap gap-2.5 content-start flex-1 overflow-y-auto no-scrollbar">
        {interestOptions.map((cat) => {
          const active = selected.includes(cat);
          return (
            <button
              key={cat}
              onClick={() => toggle(cat)}
              className={cn(
                "flex items-center gap-1.5 rounded-2xl border px-4 py-2.5 text-sm font-medium transition-all",
                active
                  ? "border-transparent bg-gradient-to-r from-violet to-magenta text-white"
                  : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
              )}
            >
              {active && <Check size={15} />}
              {cat}
            </button>
          );
        })}
      </div>

      <div className="pt-6">
        <Button fullWidth size="lg" disabled={selected.length < 3} onClick={start}>
          Start met Swyp {selected.length > 0 && `(${selected.length})`}
        </Button>
      </div>
    </div>
  );
}
