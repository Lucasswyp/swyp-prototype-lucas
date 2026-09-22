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
  toggleSave: (productId: string, adId: string) => Promise<AwardResult | null>;
  toggleFollow: (companyId: string) => Promise<void>;
  redeem: (reward: Reward) => Promise<{ ok: boolean; reason?: string; code?: string }>;
  markRedemptionUsed: (redemptionId: string) => Promise<void>;
  refreshHistory: () => Promise<void>;
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
    setRedemptions(await fetchMyRedemptions());
  }, []);

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
      const [id, wallet, likes, saves, follows, hist, reds] = await Promise.all([
        fetchMyConsumerId(),
        fetchWallet(),
        fetchMyLikedAdIds(),
        fetchMySavedProductIds(),
        fetchMyFollowedCompanyIds(),
        fetchWalletHistory(),
        fetchMyRedemptions(),
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

  function applyAward(result: AwardResult) {
    if (!result.awarded) return;
    if (typeof result.balance === "number") setBalance(result.balance);
    if (typeof result.streak === "number") setCurrentStreak(result.streak);
    refreshHistory();
  }

  const awardWatch80 = useCallback(async (adId: string, watchMs: number) => {
    const result = await awardInteraction(adId, "watch80", watchMs);
    applyAward(result);
    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const awardLike = useCallback(async (adId: string) => {
    const result = await awardInteraction(adId, "like");
    if (result.awarded) setLikedAdIds((s) => new Set(s).add(adId));
    applyAward(result);
    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const awardClick = useCallback(async (adId: string) => {
    const result = await awardInteraction(adId, "click");
    applyAward(result);
    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleSave = useCallback(
    async (productId: string, adId: string) => {
      if (!consumerId) return null;
      const isSaved = savedProductIds.has(productId);
      if (isSaved) {
        setSavedProductIds((s) => {
          const next = new Set(s);
          next.delete(productId);
          return next;
        });
        await removeSave(productId);
        return null;
      }
      setSavedProductIds((s) => new Set(s).add(productId));
      await addSave(consumerId, productId, adId);
      const result = await awardInteraction(adId, "save");
      applyAward(result);
      return result;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        await removeFollow(companyId);
        return;
      }
      setFollowedCompanyIds((s) => new Set(s).add(companyId));
      await addFollow(consumerId, companyId);
      const result = await awardFollow(companyId);
      applyAward(result);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
