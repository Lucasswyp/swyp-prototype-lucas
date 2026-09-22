// Server-authoritative reward economy: every earn/spend is validated and
// recorded by a Postgres RPC (supabase/rewards.sql), never trusted from the
// client. This module is just the thin call boundary — see that file for the
// actual rules (daily damping, streak bookkeeping, min/max clamps, etc).
import { createClient } from "@/lib/supabase/client";
import type { WalletTransaction, Redemption } from "@/types";

export type InteractionAction = "watch80" | "like" | "save" | "click";

export interface AwardResult {
  awarded: boolean;
  reason?: string;
  points?: number;
  streakBonus?: number;
  balance?: number;
  streak?: number;
}

function mapAwardRow(r: {
  awarded: boolean;
  reason?: string;
  points?: number;
  streak_bonus?: number;
  balance?: number;
  streak?: number;
}): AwardResult {
  return {
    awarded: r.awarded,
    reason: r.reason,
    points: r.points,
    streakBonus: r.streak_bonus,
    balance: r.balance,
    streak: r.streak,
  };
}

export async function awardInteraction(
  adId: string,
  action: InteractionAction,
  watchMs?: number
): Promise<AwardResult> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("award_interaction", {
    p_ad_id: adId,
    p_action: action,
    p_watch_ms: watchMs ?? null,
  });
  if (error) return { awarded: false, reason: error.message };
  return mapAwardRow(data);
}

export async function awardFollow(companyId: string): Promise<AwardResult> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("award_follow", { p_company_id: companyId });
  if (error) return { awarded: false, reason: error.message };
  return mapAwardRow(data);
}

export interface RedeemResult {
  ok: boolean;
  reason?: string;
  balance?: number;
  redemptionId?: string;
  code?: string;
}

export async function redeemReward(rewardId: string, code: string): Promise<RedeemResult> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("redeem_reward", { p_reward_id: rewardId, p_code: code });
  if (error) return { ok: false, reason: error.message };
  return { ok: data.ok, reason: data.reason, balance: data.balance, redemptionId: data.redemption_id, code };
}

export async function fetchMyConsumerId(): Promise<string | null> {
  const supabase = createClient();
  const { data } = await supabase.from("consumers").select("id").maybeSingle();
  return data?.id ?? null;
}

export interface WalletSnapshot {
  balance: number;
  currentStreak: number;
  longestStreak: number;
  freezesAvailable: number;
}

export async function fetchWallet(): Promise<WalletSnapshot> {
  const supabase = createClient();
  const [{ data: wallet }, { data: streak }] = await Promise.all([
    supabase.from("consumer_wallets").select("balance").maybeSingle(),
    supabase.from("consumer_streaks").select("current_streak, longest_streak, freezes_available").maybeSingle(),
  ]);
  return {
    balance: wallet?.balance ?? 0,
    currentStreak: streak?.current_streak ?? 0,
    longestStreak: streak?.longest_streak ?? 0,
    freezesAvailable: streak?.freezes_available ?? 0,
  };
}

const ACTION_LABELS: Record<string, string> = {
  watch80: "Advertentie 80% bekeken",
  like: "Advertentie geliket",
  save: "Product opgeslagen",
  click: "Doorgeklikt naar winkel",
  follow: "Bedrijf gevolgd",
  streak_daily: "Dagelijkse streak-bonus",
  welcome_bonus: "Welkomstbonus",
  redeem: "Reward ingewisseld",
};

export async function fetchWalletHistory(limit = 50): Promise<WalletTransaction[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("token_events")
    .select("id, action, points, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: String(r.id),
    amount: r.points,
    reason: ACTION_LABELS[r.action] ?? r.action,
    createdAt: r.created_at,
  }));
}

export async function fetchMyLikedAdIds(): Promise<Set<string>> {
  const supabase = createClient();
  const { data, error } = await supabase.from("token_events").select("ad_id").eq("action", "like");
  if (error) throw error;
  return new Set((data ?? []).map((r) => r.ad_id).filter(Boolean) as string[]);
}

export async function fetchMySavedProductIds(): Promise<Set<string>> {
  const supabase = createClient();
  const { data, error } = await supabase.from("saves").select("product_id");
  if (error) throw error;
  return new Set((data ?? []).map((r) => r.product_id));
}

export async function fetchMyFollowedCompanyIds(): Promise<Set<string>> {
  const supabase = createClient();
  const { data, error } = await supabase.from("follows").select("company_id");
  if (error) throw error;
  return new Set((data ?? []).map((r) => r.company_id));
}

// Toggling save/follow is plain, fully-reversible user data (RLS-scoped to
// the caller) — the one-time token award is a *separate* call the UI fires
// alongside the first save/follow, not something these functions do.
export async function addSave(consumerId: string, productId: string, adId: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("saves")
    .upsert({ consumer_id: consumerId, product_id: productId, ad_id: adId }, { onConflict: "consumer_id,product_id" });
  if (error) throw error;
}

export async function removeSave(productId: string) {
  const supabase = createClient();
  const { error } = await supabase.from("saves").delete().eq("product_id", productId);
  if (error) throw error;
}

export async function addFollow(consumerId: string, companyId: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("follows")
    .upsert({ consumer_id: consumerId, company_id: companyId }, { onConflict: "consumer_id,company_id" });
  if (error) throw error;
}

export async function removeFollow(companyId: string) {
  const supabase = createClient();
  const { error } = await supabase.from("follows").delete().eq("company_id", companyId);
  if (error) throw error;
}

export async function fetchMyRedemptions(): Promise<Redemption[]> {
  const supabase = createClient();
  const consumerId = await fetchMyConsumerId();
  if (!consumerId) return [];
  const { data, error } = await supabase
    .from("redemptions")
    .select("*")
    .eq("consumer_id", consumerId)
    .order("redeemed_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id,
    rewardId: r.reward_id,
    redeemedAt: r.redeemed_at,
    status: r.status,
    code: r.code,
  }));
}

export async function markRedemptionUsed(redemptionId: string) {
  const supabase = createClient();
  const { error } = await supabase.from("redemptions").update({ status: "used" }).eq("id", redemptionId);
  if (error) throw error;
}
