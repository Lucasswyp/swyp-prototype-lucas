"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Category } from "@/types";

// Token balance, streaks, likes/saves/follows and redemptions all live
// server-side now (see WalletContext + supabase/rewards.sql) — a client-side
// store can't be trusted as the source of truth for anything that pays out
// real value. This store is left with only genuinely local, non-reward UI
// state: onboarding flags and interest picks.

interface AppState {
  hasHydrated: boolean;
  setHasHydrated: () => void;
  onboardingComplete: boolean;
  interests: Category[];

  // Purely a "have I seen this one yet" hint for the Discover feed's
  // unseen-first ordering — not a reward signal, so it's fine to keep local.
  adWatchProgress: Record<string, number>;
  markWatched: (adId: string, percent: number) => void;

  setInterests: (categories: Category[]) => void;
  completeOnboarding: () => void;
}

const baseState = {
  hasHydrated: false,
  onboardingComplete: false,
  interests: [] as Category[],
  adWatchProgress: {} as Record<string, number>,
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      ...baseState,

      setHasHydrated: () => set({ hasHydrated: true }),

      setInterests: (categories) => set({ interests: categories }),
      completeOnboarding: () => set({ onboardingComplete: true }),

      markWatched: (adId, percent) =>
        set((s) => {
          const prev = s.adWatchProgress[adId] ?? 0;
          // Playback loops, so without this a looping card would otherwise
          // keep re-writing the same max value to localStorage on every
          // `timeupdate` tick for as long as it stays on screen.
          if (percent <= prev) return s;
          return { adWatchProgress: { ...s.adWatchProgress, [adId]: percent } };
        }),
    }),
    {
      name: "swyp-store",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated();
      },
    }
  )
);

export function useHasHydrated() {
  return useAppStore((s) => s.hasHydrated);
}
