"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Category, Challenge, SwypEvent, SwypEventName } from "@/types";
import { defaultChallenges } from "@/data/seed";

// Token balance, streaks, likes/saves/follows and redemptions all live
// server-side now (see WalletContext + supabase/rewards.sql) — a client-side
// store can't be trusted as the source of truth for anything that pays out
// real value. This store is left with only genuinely local, non-reward UI
// state: onboarding flags, interest picks, and the (still-mocked, unrelated)
// XP/challenges flavor layer.

interface AppState {
  hasHydrated: boolean;
  setHasHydrated: () => void;
  onboardingComplete: boolean;
  interests: Category[];

  xp: number;
  challenges: Challenge[];

  // Purely a "have I seen this one yet" hint for the Discover feed's
  // unseen-first ordering — not a reward signal, so it's fine to keep local.
  adWatchProgress: Record<string, number>;
  markWatched: (adId: string, percent: number) => void;

  events: SwypEvent[];

  level: () => number;

  setInterests: (categories: Category[]) => void;
  completeOnboarding: () => void;
  logEvent: (name: SwypEventName, payload?: Record<string, unknown>) => void;
  bumpChallenge: (challengeId: string, amount?: number) => void;

  resetDemo: () => void;
}

const initialChallenges = () => defaultChallenges.map((c) => ({ ...c }));

const baseState = {
  hasHydrated: false,
  onboardingComplete: false,
  interests: [] as Category[],
  xp: 0,
  challenges: initialChallenges(),
  adWatchProgress: {} as Record<string, number>,
  events: [] as SwypEvent[],
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...baseState,

      setHasHydrated: () => set({ hasHydrated: true }),

      level: () => Math.max(1, Math.floor(get().xp / 1000) + 1),

      setInterests: (categories) => set({ interests: categories }),
      completeOnboarding: () => set({ onboardingComplete: true }),

      markWatched: (adId, percent) =>
        set((s) => ({
          adWatchProgress: { ...s.adWatchProgress, [adId]: Math.max(s.adWatchProgress[adId] ?? 0, percent) },
        })),

      logEvent: (name, payload) =>
        set((s) => ({
          events: [...s.events.slice(-199), { name, payload, timestamp: Date.now() }],
        })),

      bumpChallenge: (challengeId, amount = 1) =>
        set((s) => ({
          challenges: s.challenges.map((c) => {
            if (c.id !== challengeId || c.progress >= c.target) return c;
            const progress = Math.min(c.target, c.progress + amount);
            return { ...c, progress };
          }),
        })),

      resetDemo: () => set({ ...baseState, challenges: initialChallenges() }),
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
