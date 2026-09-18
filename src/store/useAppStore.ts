"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  Category,
  Reward,
  Redemption,
  WalletTransaction,
  Challenge,
  SwypEvent,
  SwypEventName,
} from "@/types";
import { defaultChallenges } from "@/data/seed";

function genId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function genCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "SWYP-";
  for (let i = 0; i < 6; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

interface AppState {
  hasHydrated: boolean;
  setHasHydrated: () => void;
  onboardingComplete: boolean;
  interests: Category[];

  tokenBalance: number;
  walletHistory: WalletTransaction[];
  xp: number;
  streakDays: number;
  challenges: Challenge[];

  rewardedActions: Record<string, boolean>;
  adWatchProgress: Record<string, number>;
  likedAds: Record<string, boolean>;
  savedProductIds: Record<string, boolean>;
  followedCompanyIds: Record<string, boolean>;

  redemptions: Redemption[];

  events: SwypEvent[];

  // derived helpers
  level: () => number;

  // actions
  setInterests: (categories: Category[]) => void;
  completeOnboarding: () => void;

  logEvent: (name: SwypEventName, payload?: Record<string, unknown>) => void;
  addTokens: (amount: number, reason: string) => void;

  recordWatchProgress: (adId: string, percent: number, rewardRules: { watch80: number }) => boolean[];
  toggleLike: (adId: string, rewardAmount: number) => boolean;
  toggleSave: (productId: string, adId: string, rewardAmount: number) => boolean;
  toggleFollow: (companyId: string) => void;
  viewProduct: (productId: string, bonus?: number) => void;
  viewCompany: (companyId: string, bonus?: number) => void;

  redeemReward: (reward: Reward) => { ok: boolean; reason?: string; redemption?: Redemption };
  markRedemptionUsed: (redemptionId: string) => void;

  bumpChallenge: (challengeId: string, amount?: number) => void;

  resetDemo: () => void;
}

const initialChallenges = () => defaultChallenges.map((c) => ({ ...c }));

const baseState = {
  hasHydrated: false,
  onboardingComplete: false,
  interests: [] as Category[],
  tokenBalance: 1240,
  walletHistory: [
    {
      id: genId("wt"),
      amount: 1240,
      reason: "Welkomstbonus",
      createdAt: new Date().toISOString(),
    },
  ] as WalletTransaction[],
  xp: 3420,
  streakDays: 5,
  challenges: initialChallenges(),
  rewardedActions: {} as Record<string, boolean>,
  adWatchProgress: {} as Record<string, number>,
  likedAds: {} as Record<string, boolean>,
  savedProductIds: {} as Record<string, boolean>,
  followedCompanyIds: {} as Record<string, boolean>,
  redemptions: [] as Redemption[],
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

      logEvent: (name, payload) =>
        set((s) => ({
          events: [...s.events.slice(-199), { name, payload, timestamp: Date.now() }],
        })),

      addTokens: (amount, reason) =>
        set((s) => ({
          tokenBalance: s.tokenBalance + amount,
          xp: s.xp + Math.max(0, amount) * 5,
          walletHistory: [
            {
              id: genId("wt"),
              amount,
              reason,
              createdAt: new Date().toISOString(),
            },
            ...s.walletHistory,
          ],
        })),

      // returns [crossedWatch80, crossedComplete] so callers can log remote interactions
      recordWatchProgress: (adId, percent, rewardRules) => {
        const s = get();
        const prev = s.adWatchProgress[adId] ?? 0;
        if (percent <= prev) return [false, false];
        set({ adWatchProgress: { ...s.adWatchProgress, [adId]: percent } });

        let crossedWatch80 = false;
        let crossedComplete = false;

        if (percent >= 80) {
          const key = `${adId}:watch80`;
          if (!s.rewardedActions[key]) {
            set((st) => ({ rewardedActions: { ...st.rewardedActions, [key]: true } }));
            get().addTokens(rewardRules.watch80, "Advertentie 80% bekeken");
            get().bumpChallenge("ch-watch10");
            crossedWatch80 = true;
          }
        }
        if (percent >= 100) {
          const key = `${adId}:complete`;
          if (!s.rewardedActions[key]) {
            set((st) => ({ rewardedActions: { ...st.rewardedActions, [key]: true } }));
            get().addTokens(1, "Advertentie volledig bekeken (bonus)");
            crossedComplete = true;
          }
        }
        return [crossedWatch80, crossedComplete];
      },

      // returns true if this toggle just turned the like ON for the first time (reward-eligible)
      toggleLike: (adId, rewardAmount) => {
        const s = get();
        const isLiked = !!s.likedAds[adId];
        set({ likedAds: { ...s.likedAds, [adId]: !isLiked } });
        get().logEvent(isLiked ? "ad_swipe_left" : "ad_like", { adId });
        if (!isLiked) {
          const key = `${adId}:like`;
          if (!s.rewardedActions[key]) {
            set((st) => ({ rewardedActions: { ...st.rewardedActions, [key]: true } }));
            get().addTokens(rewardAmount, "Advertentie geliket");
            return true;
          }
        }
        return false;
      },

      toggleSave: (productId, adId, rewardAmount) => {
        const s = get();
        const isSaved = !!s.savedProductIds[productId];
        set({ savedProductIds: { ...s.savedProductIds, [productId]: !isSaved } });
        get().logEvent("ad_save", { productId, adId, saved: !isSaved });
        if (!isSaved) {
          const key = `${adId}:save`;
          if (!s.rewardedActions[key]) {
            set((st) => ({ rewardedActions: { ...st.rewardedActions, [key]: true } }));
            get().addTokens(rewardAmount, "Product opgeslagen");
            get().bumpChallenge("ch-save3");
            return true;
          }
        }
        return false;
      },

      toggleFollow: (companyId) => {
        const s = get();
        const isFollowed = !!s.followedCompanyIds[companyId];
        set({ followedCompanyIds: { ...s.followedCompanyIds, [companyId]: !isFollowed } });
        get().logEvent("company_follow", { companyId, followed: !isFollowed });
        if (!isFollowed) {
          get().bumpChallenge("ch-discover3");
        }
      },

      viewProduct: (productId, bonus = 1) => {
        const s = get();
        get().logEvent("product_view", { productId });
        const key = `${productId}:productView`;
        if (!s.rewardedActions[key]) {
          set((st) => ({ rewardedActions: { ...st.rewardedActions, [key]: true } }));
          get().addTokens(bonus, "Productdetails bekeken");
        }
      },

      viewCompany: (companyId, bonus = 1) => {
        const s = get();
        get().logEvent("company_view", { companyId });
        const key = `${companyId}:companyView`;
        if (!s.rewardedActions[key]) {
          set((st) => ({ rewardedActions: { ...st.rewardedActions, [key]: true } }));
          get().addTokens(bonus, "Bedrijfsprofiel bekeken");
        }
      },

      redeemReward: (reward) => {
        const s = get();
        if (s.tokenBalance < reward.tokenCost) {
          return { ok: false, reason: "Onvoldoende Swyp Tokens" };
        }
        const redemption: Redemption = {
          id: genId("rd"),
          rewardId: reward.id,
          redeemedAt: new Date().toISOString(),
          status: "active",
          code: genCode(),
        };
        set((st) => ({
          tokenBalance: st.tokenBalance - reward.tokenCost,
          walletHistory: [
            {
              id: genId("wt"),
              amount: -reward.tokenCost,
              reason: reward.title,
              createdAt: new Date().toISOString(),
            },
            ...st.walletHistory,
          ],
          redemptions: [redemption, ...st.redemptions],
        }));
        get().logEvent("reward_redeem", { rewardId: reward.id });
        return { ok: true, redemption };
      },

      markRedemptionUsed: (redemptionId) => {
        set((s) => ({
          redemptions: s.redemptions.map((r) =>
            r.id === redemptionId ? { ...r, status: "used" } : r
          ),
        }));
        get().logEvent("reward_use", { redemptionId });
      },

      bumpChallenge: (challengeId, amount = 1) =>
        set((s) => ({
          challenges: s.challenges.map((c) => {
            if (c.id !== challengeId || c.progress >= c.target) return c;
            const progress = Math.min(c.target, c.progress + amount);
            return { ...c, progress };
          }),
        })),

      resetDemo: () =>
        set({
          ...baseState,
          walletHistory: [
            {
              id: genId("wt"),
              amount: 1240,
              reason: "Welkomstbonus",
              createdAt: new Date().toISOString(),
            },
          ],
          challenges: initialChallenges(),
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
