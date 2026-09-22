"use client";

import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";
import {
  fetchWallet,
  fetchWalletHistory,
  fetchMyLikedAdIds,
  fetchMySavedProductIds,
  fetchMyFollowedCompanyIds,
  fetchMyConsumerId,
  fetchMyRedemptions,
  markRedemptionUsed as markRedemptionUsedRemote,
  awardInteraction,
  awardFollow,
  redeemReward,
  addSave,
  removeSave,
  addFollow,
  removeFollow,
  type AwardResult,
} from "@/lib/rewards";
import { useConsumerAuth } from "@/contexts/ConsumerAuthContext";
import type { WalletTransaction, Reward, Redemption } from "@/types";

interface WalletValue {
  loading: boolean;
  balance: number;
  currentStreak: number;
  longestStreak: number;
  freezesAvailable: number;
  history: WalletTransaction[];
  likedAdIds: Set<string>;
  savedProductIds: Set<string>;
  followedCompanyIds: Set<string>;
  redemptions: Redemption[];
  awardWatch80: (adId: string, watchMs: number) => Promise<AwardResult>;
  awardLike: (adId: string) => Promise<AwardResult>;
  awardClick: (adId: string) => Promise<AwardResult>;
  toggleSave: (productId: string, adId: string | null) => Promise<AwardResult | null>;
  toggleFollow: (companyId: string) => Promise<void>;
  redeem: (reward: Reward) => Promise<{ ok: boolean; reason?: string; code?: string }>;
  markRedemptionUsed: (redemptionId: string) => Promise<void>;
  refreshHistory: () => Promise<void>;
  refreshRedemptions: () => Promise<void>;
}

const WalletContext = createContext<WalletValue | null>(null);

function genCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "SWYP-";
  for (let i = 0; i < 6; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const { isLoggedIn } = useConsumerAuth();
  const [loading, setLoading] = useState(true);
  const [consumerId, setConsumerId] = useState<string | null>(null);
  const [balance, setBalance] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [freezesAvailable, setFreezesAvailable] = useState(0);
  const [history, setHistory] = useState<WalletTransaction[]>([]);
  const [likedAdIds, setLikedAdIds] = useState<Set<string>>(new Set());
  const [savedProductIds, setSavedProductIds] = useState<Set<string>>(new Set());
  const [followedCompanyIds, setFollowedCompanyIds] = useState<Set<string>>(new Set());
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);

  const refreshHistory = useCallback(async () => {
    setHistory(await fetchWalletHistory());
  }, []);

  const refreshRedemptions = useCallback(async () => {
    if (!consumerId) return;
    setRedemptions(await fetchMyRedemptions(consumerId));
  }, [consumerId]);

  useEffect(() => {
    if (!isLoggedIn) {
      // Reset to guest state — a real state transition in response to an
      // external auth change, not a render-time side effect to avoid.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false);
      setConsumerId(null);
      setBalance(0);
      setCurrentStreak(0);
      setLongestStreak(0);
      setFreezesAvailable(0);
      setHistory([]);
      setLikedAdIds(new Set());
      setSavedProductIds(new Set());
      setFollowedCompanyIds(new Set());
      setRedemptions([]);
      return;
    }
    let cancelled = false;
    (async () => {
      const id = await fetchMyConsumerId();
      const [wallet, likes, saves, follows, hist, reds] = await Promise.all([
        fetchWallet(),
        fetchMyLikedAdIds(),
        fetchMySavedProductIds(),
        fetchMyFollowedCompanyIds(),
        fetchWalletHistory(),
        id ? fetchMyRedemptions(id) : Promise.resolve([]),
      ]);
      if (cancelled) return;
      setConsumerId(id);
      setBalance(wallet.balance);
      setCurrentStreak(wallet.currentStreak);
      setLongestStreak(wallet.longestStreak);
      setFreezesAvailable(wallet.freezesAvailable);
      setLikedAdIds(likes);
      setSavedProductIds(saves);
      setFollowedCompanyIds(follows);
      setHistory(hist);
      setRedemptions(reds);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [isLoggedIn]);

  // Awards update balance/streak straight from the RPC response — they don't
  // need a full history refetch every single time (that's ~1 extra request
  // per like/save/watch/follow, for data only ever shown on the wallet and
  // profile pages). Those pages refresh history/redemptions themselves on
  // mount instead.
  function applyAward(result: AwardResult) {
    if (typeof result.balance === "number") setBalance(result.balance);
    if (typeof result.streak === "number") setCurrentStreak(result.streak);
  }

  const awardWatch80 = useCallback(async (adId: string, watchMs: number) => {
    const result = await awardInteraction(adId, "watch80", watchMs);
    applyAward(result);
    return result;
  }, []);

  const awardLike = useCallback(async (adId: string) => {
    const result = await awardInteraction(adId, "like");
    if (result.awarded) setLikedAdIds((s) => new Set(s).add(adId));
    applyAward(result);
    return result;
  }, []);

  const awardClick = useCallback(async (adId: string) => {
    const result = await awardInteraction(adId, "click");
    applyAward(result);
    return result;
  }, []);

  const toggleSave = useCallback(
    async (productId: string, adId: string | null) => {
      if (!consumerId) return null;
      const isSaved = savedProductIds.has(productId);
      if (isSaved) {
        setSavedProductIds((s) => {
          const next = new Set(s);
          next.delete(productId);
          return next;
        });
        try {
          await removeSave(productId);
        } catch {
          // Revert — the remove never actually happened server-side.
          setSavedProductIds((s) => new Set(s).add(productId));
        }
        return null;
      }
      setSavedProductIds((s) => new Set(s).add(productId));
      try {
        await addSave(consumerId, productId, adId);
      } catch {
        setSavedProductIds((s) => {
          const next = new Set(s);
          next.delete(productId);
          return next;
        });
        return null;
      }
      // No ad context (e.g. a product with no live campaign) — still save
      // it, just nothing to award a token for.
      if (!adId) return null;
      const result = await awardInteraction(adId, "save");
      applyAward(result);
      return result;
    },
    [consumerId, savedProductIds]
  );

  const toggleFollow = useCallback(
    async (companyId: string) => {
      if (!consumerId) return;
      const isFollowed = followedCompanyIds.has(companyId);
      if (isFollowed) {
        setFollowedCompanyIds((s) => {
          const next = new Set(s);
          next.delete(companyId);
          return next;
        });
        try {
          await removeFollow(companyId);
        } catch {
          setFollowedCompanyIds((s) => new Set(s).add(companyId));
        }
        return;
      }
      setFollowedCompanyIds((s) => new Set(s).add(companyId));
      try {
        await addFollow(consumerId, companyId);
      } catch {
        setFollowedCompanyIds((s) => {
          const next = new Set(s);
          next.delete(companyId);
          return next;
        });
        return;
      }
      const result = await awardFollow(companyId);
      applyAward(result);
    },
    [consumerId, followedCompanyIds]
  );

  const redeem = useCallback(
    async (reward: Reward) => {
      const code = genCode();
      const result = await redeemReward(reward.id, code);
      if (result.ok && typeof result.balance === "number") {
        setBalance(result.balance);
        refreshHistory();
        refreshRedemptions();
      }
      return { ok: result.ok, reason: result.reason, code: result.ok ? code : undefined };
    },
    [refreshHistory, refreshRedemptions]
  );

  const markRedemptionUsed = useCallback(async (redemptionId: string) => {
    await markRedemptionUsedRemote(redemptionId);
    setRedemptions((rs) => rs.map((r) => (r.id === redemptionId ? { ...r, status: "used" } : r)));
  }, []);

  return (
    <WalletContext.Provider
      value={{
        loading,
        balance,
        currentStreak,
        longestStreak,
        freezesAvailable,
        history,
        likedAdIds,
        savedProductIds,
        followedCompanyIds,
        redemptions,
        awardWatch80,
        awardLike,
        awardClick,
        toggleSave,
        toggleFollow,
        redeem,
        markRedemptionUsed,
        refreshHistory,
        refreshRedemptions,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within WalletProvider");
  return ctx;
}
