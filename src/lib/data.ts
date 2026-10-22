/* eslint-disable @typescript-eslint/no-explicit-any -- this module is the
   boundary layer that maps loosely-typed Supabase rows onto our strict
   internal types; the `any` params below are the raw row shape. */
import { createClient } from "@/lib/supabase/client";
import type { Company, Product, Ad, Campaign, Reward } from "@/types";

function mapCompany(r: any): Company {
  return {
    id: r.id,
    name: r.name,
    logoUrl: r.logo_url,
    bannerUrl: r.banner_url,
    verified: r.verified,
    category: r.category,
    location: r.location,
    website: r.website,
    description: r.description,
    followers: r.followers ?? 0,
  };
}

function mapProduct(r: any): Product {
  return {
    id: r.id,
    companyId: r.business_id,
    name: r.name,
    description: r.description,
    imageUrl: r.image_url,
    price: Number(r.price),
    oldPrice: r.old_price ? Number(r.old_price) : undefined,
    category: r.category,
    url: r.url,
    rating: Number(r.rating ?? 4.5),
    highlights: r.highlights ?? [],
  };
}

// Platform guardrails (must match supabase/rewards.sql's award_interaction):
// keeps watch >= click >= save >= like no matter what a business sets on its
// own campaign, so the UI never shows a number the server won't actually pay.
const REWARD_BOUNDS = {
  watch80: { min: 10, max: 25, default: 15 },
  click: { min: 5, max: 20, default: 10 },
  save: { min: 3, max: 15, default: 8 },
  like: { min: 1, max: 8, default: 4 },
};

function clampReward(action: keyof typeof REWARD_BOUNDS, value: number | null | undefined) {
  const { min, max, default: fallback } = REWARD_BOUNDS[action];
  return Math.min(max, Math.max(min, value ?? fallback));
}

function mapAd(r: any): Ad {
  const campaign = Array.isArray(r.campaigns) ? r.campaigns[0] : r.campaigns;
  return {
    id: r.id,
    companyId: r.business_id,
    productId: r.product_id,
    campaignId: r.campaign_id,
    videoUrl: r.video_url,
    posterUrl: r.poster_url,
    caption: r.caption,
    category: r.category,
    ctaLabel: r.cta_label,
    moderationStatus: r.moderation_status ?? "approved",
    rewardRules: {
      watch80: clampReward("watch80", campaign?.reward_watch),
      like: clampReward("like", campaign?.reward_like),
      save: clampReward("save", campaign?.reward_save),
      click: clampReward("click", campaign?.reward_click),
    },
  };
}

function mapCampaign(r: any): Campaign {
  const t = r.targeting ?? {};
  return {
    id: r.id,
    companyId: r.business_id,
    name: r.name,
    objective: r.objective,
    status: r.status,
    adId: r.ads?.[0]?.id ?? "",
    dailyBudget: Number(r.daily_budget),
    totalBudget: Number(r.total_budget),
    startDate: r.start_date,
    endDate: r.end_date,
    targeting: {
      ageMin: t.ageMin ?? 18,
      ageMax: t.ageMax ?? 45,
      gender: t.gender ?? "Alle",
      location: t.location ?? "Nederland",
      radiusKm: t.radiusKm ?? 50,
      interests: t.interests ?? [],
    },
    rewardRules: {
      watch80: r.reward_watch,
      like: r.reward_like,
      save: r.reward_save,
      click: r.reward_click,
    },
    metrics: r.metrics ?? {
      spend: 0,
      impressions: 0,
      uniqueViews: 0,
      completedViews: 0,
      likes: 0,
      saves: 0,
      clicks: 0,
      conversions: 0,
      revenue: 0,
    },
    retention: r.retention ?? [0, 2, 4, 6, 8, 10].map((second) => ({ second, percent: Math.max(30, 100 - second * 6) })),
    createdAt: r.created_at,
  };
}

function mapReward(r: any): Reward {
  return {
    id: r.id,
    companyId: r.business_id,
    title: r.title,
    description: r.description,
    imageUrl: r.image_url,
    category: r.category,
    tokenCost: r.token_cost,
    moneyValue: r.money_value ? Number(r.money_value) : undefined,
    terms: r.terms,
    stock: r.stock,
    startDate: r.start_date,
    endDate: r.end_date,
    redemptionMethod: r.redemption_method,
  };
}

export async function fetchCompanies(): Promise<Company[]> {
  const supabase = createClient();
  // De view laat het interne account-id weg; de tabel zelf is alleen nog voor de eigenaar.
  const { data, error } = await supabase.from("public_businesses").select("*").order("created_at");
  if (error) throw error;
  return (data ?? []).map(mapCompany);
}

export async function fetchProducts(): Promise<Product[]> {
  const supabase = createClient();
  const { data, error } = await supabase.from("products").select("*").order("created_at");
  if (error) throw error;
  return (data ?? []).map(mapProduct);
}

// Campagnes zelf zijn alleen voor hun eigenaar leesbaar; wat een video
// oplevert komt uit de openbare view campaign_rewards.
async function withCampaignRewards(rows: any[]): Promise<Ad[]> {
  const ids = [...new Set(rows.map((r) => r.campaign_id).filter(Boolean))];
  const byCampaign = new Map<string, any>();
  if (ids.length > 0) {
    const { data, error } = await createClient()
      .from("campaign_rewards")
      .select("campaign_id, reward_watch, reward_like, reward_save, reward_click")
      .in("campaign_id", ids);
    if (error) throw error;
    for (const r of data ?? []) byCampaign.set(r.campaign_id, r);
  }
  return rows.map((r) => mapAd({ ...r, campaigns: byCampaign.get(r.campaign_id) }));
}

export async function fetchAds(): Promise<Ad[]> {
  const supabase = createClient();
  const { data, error } = await supabase.from("ads").select("*").order("created_at");
  if (error) throw error;
  return withCampaignRewards(data ?? []);
}

// The consumer feed (src/app/app/page.tsx)
// used to load every ad in the table via fetchAds() above — fine at a few
// dozen rows, but every device downloading the entire ads table on every
// poll doesn't scale. This paginates instead, newest-first, approved-only
// (fetchAds() stays unfiltered/unpaginated for the business dashboard,
// which needs to see its own pending/rejected ads too).
export const ADS_PAGE_SIZE = 30;

export async function fetchAdsPage(
  offset: number,
  limit = ADS_PAGE_SIZE
): Promise<{ ads: Ad[]; hasMore: boolean }> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("ads")
    .select("*")
    .eq("moderation_status", "approved")
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) throw error;
  const rows = data ?? [];
  const ads = await withCampaignRewards(rows);
  return { ads, hasMore: rows.length === limit };
}

export async function fetchCampaigns(): Promise<Campaign[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("campaigns")
    .select("*, ads(id)")
    .order("created_at");
  if (error) throw error;
  return (data ?? []).map(mapCampaign);
}

export async function fetchRewards(): Promise<Reward[]> {
  const supabase = createClient();
  const { data, error } = await supabase.from("rewards").select("*").order("created_at");
  if (error) throw error;
  return (data ?? []).map(mapReward);
}

export async function fetchAll() {
  const [companies, products, ads, campaigns, rewards] = await Promise.all([
    fetchCompanies(),
    fetchProducts(),
    fetchAds(),
    fetchCampaigns(),
    fetchRewards(),
  ]);
  return { companies, products, ads, campaigns, rewards };
}

// ---- Business mutations ----

export async function createProduct(businessId: string, p: Omit<Product, "id" | "companyId" | "rating" | "highlights">) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("products")
    .insert({
      business_id: businessId,
      name: p.name,
      description: p.description,
      image_url: p.imageUrl,
      price: p.price,
      old_price: p.oldPrice ?? null,
      category: p.category,
      url: p.url,
    })
    .select("*")
    .single();
  if (error) throw error;
  return mapProduct(data);
}

export async function updateProduct(product: Product) {
  const supabase = createClient();
  const { error } = await supabase
    .from("products")
    .update({
      name: product.name,
      description: product.description,
      image_url: product.imageUrl,
      price: product.price,
      old_price: product.oldPrice ?? null,
      category: product.category,
      url: product.url,
    })
    .eq("id", product.id);
  if (error) throw error;
}

export async function deleteProduct(productId: string) {
  const supabase = createClient();
  const { error } = await supabase.from("products").delete().eq("id", productId);
  if (error) throw error;
}

export async function createReward(businessId: string, r: Omit<Reward, "id" | "companyId">) {
  const supabase = createClient();
  const { error } = await supabase.from("rewards").insert({
    business_id: businessId,
    title: r.title,
    description: r.description,
    image_url: r.imageUrl,
    category: r.category,
    token_cost: r.tokenCost,
    money_value: r.moneyValue ?? null,
    terms: r.terms,
    stock: r.stock,
    start_date: r.startDate,
    end_date: r.endDate,
    redemption_method: r.redemptionMethod,
  });
  if (error) throw error;
}

export async function createAd(businessId: string, ad: {
  productId: string;
  videoUrl: string;
  posterUrl: string;
  caption: string;
  category: string;
  ctaLabel: string;
}) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("ads")
    .insert({
      business_id: businessId,
      product_id: ad.productId,
      video_url: ad.videoUrl,
      poster_url: ad.posterUrl,
      caption: ad.caption,
      category: ad.category,
      cta_label: ad.ctaLabel,
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}

export async function createCampaign(
  businessId: string,
  c: Omit<Campaign, "id" | "companyId" | "metrics" | "retention" | "createdAt">
) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("campaigns")
    .insert({
      business_id: businessId,
      name: c.name,
      objective: c.objective,
      status: c.status,
      daily_budget: c.dailyBudget,
      total_budget: c.totalBudget,
      start_date: c.startDate,
      end_date: c.endDate,
      targeting: c.targeting,
      reward_watch: clampReward("watch80", c.rewardRules.watch80),
      reward_like: clampReward("like", c.rewardRules.like),
      reward_save: clampReward("save", c.rewardRules.save),
      reward_click: clampReward("click", c.rewardRules.click),
    })
    .select("id")
    .single();
  if (error) throw error;

  await supabase.from("ads").update({ campaign_id: data.id }).eq("id", c.adId);
  return data.id as string;
}

// Budget van een afgeronde campagne aanvullen en hem weer live zetten.
export async function topUpCampaign(campaignId: string, plan: { totalBudget: number; endDate: string }) {
  const supabase = createClient();
  const { error } = await supabase
    .from("campaigns")
    .update({ total_budget: plan.totalBudget, end_date: plan.endDate || null, status: "Active" })
    .eq("id", campaignId);
  if (error) throw error;
}

export async function updateCampaignStatus(campaignId: string, status: Campaign["status"]) {
  const supabase = createClient();
  const { error } = await supabase.from("campaigns").update({ status }).eq("id", campaignId);
  if (error) throw error;
}

export async function uploadAdVideo(businessId: string, file: File): Promise<string> {
  const supabase = createClient();
  const ext = file.name.split(".").pop();
  const path = `${businessId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("ad-videos").upload(path, file);
  if (error) throw error;
  const { data } = supabase.storage.from("ad-videos").getPublicUrl(path);
  return data.publicUrl;
}

// ---- Consumer interactions (shared analytics) ----

export async function logInteraction(event: {
  deviceId: string;
  /** Wordt genegeerd: de server leidt bedrijf en product af van de advertentie. */
  businessId?: string;
  adId?: string;
  /** Wordt genegeerd, zie businessId. */
  productId?: string;
  eventName: string;
  value?: number;
}) {
  if (!event.adId) return;
  const supabase = createClient();
  // Fire-and-forget: een mislukte meting mag de app nooit storen.
  await supabase
    .rpc("log_interaction", {
      p_device_id: event.deviceId,
      p_event: event.eventName,
      p_ad_id: event.adId,
      p_value: event.value ?? null,
    })
    .then(
      () => undefined,
      () => undefined
    );
}

export interface Interaction {
  event_name: string;
  device_id: string;
  ad_id: string | null;
  created_at: string;
}

export async function fetchInteractionsForBusiness(businessId: string): Promise<Interaction[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("interactions")
    .select("*")
    .eq("business_id", businessId);
  if (error) throw error;
  return data ?? [];
}

export interface AnalyticsTotals {
  impressions: number;
  watch80: number;
  completed: number;
  likes: number;
  saves: number;
  clicks: number;
  /** Hoe vaak een kijker de video naar een vriend heeft doorgestuurd. */
  shares: number;
  uniqueDevices: number;
}

export function computeAnalytics(interactions: Pick<Interaction, "event_name" | "device_id" | "ad_id">[], adId?: string): AnalyticsTotals {
  const relevant = adId ? interactions.filter((i) => i.ad_id === adId) : interactions;
  // Een share draagt de id van de consument, geen apparaat: telt niet mee als kijker.
  const devices = new Set(relevant.filter((i) => i.event_name !== "share").map((i) => i.device_id));
  const count = (name: string) => relevant.filter((i) => i.event_name === name).length;
  return {
    impressions: count("impression"),
    watch80: count("watch80"),
    completed: count("complete"),
    likes: count("like"),
    saves: count("save"),
    clicks: count("click"),
    shares: count("share"),
    uniqueDevices: devices.size,
  };
}

export async function fetchRedemptionsForBusiness(businessId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("redemptions")
    .select("*, rewards!inner(business_id)")
    .eq("rewards.business_id", businessId);
  if (error) throw error;
  return data ?? [];
}


// ---- Kortingscodes en budget (zie supabase/reward_codes_and_budget.sql) ----

export async function addRewardCodes(rewardId: string, rawCodes: string): Promise<{ added: number; skipped: number }> {
  const codes = rawCodes.split(/[\n,;]+/).map((c) => c.trim()).filter(Boolean);
  const supabase = createClient();
  const { data, error } = await supabase.rpc("add_reward_codes", { p_reward_id: rewardId, p_codes: codes });
  if (error) throw error;
  if (!data?.ok) throw new Error("Deze reward is niet van jouw bedrijf.");
  return { added: data.added, skipped: data.skipped };
}

export async function fetchRewardCodeCounts(): Promise<Record<string, { available: number; claimed: number }>> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("get_reward_code_counts");
  if (error) throw error;
  const out: Record<string, { available: number; claimed: number }> = {};
  for (const r of (data ?? []) as { reward_id: string; available: number; claimed: number }[]) {
    out[r.reward_id] = { available: r.available, claimed: r.claimed };
  }
  return out;
}

export type CodeCheck = { found: false } | { found: true; status: "active" | "used" | "used_now"; title: string };

export async function checkRedemptionCode(code: string, markUsed: boolean): Promise<CodeCheck> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("business_use_code", { p_code: code, p_mark_used: markUsed });
  if (error) throw error;
  return data as CodeCheck;
}

export async function fetchCampaignSpend(): Promise<Record<string, { spent: number; today: number }>> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("get_campaign_spend");
  if (error) throw error;
  const out: Record<string, { spent: number; today: number }> = {};
  for (const r of (data ?? []) as { campaign_id: string; spent_eur: number; spent_today_eur: number }[]) {
    out[r.campaign_id] = { spent: Number(r.spent_eur), today: Number(r.spent_today_eur) };
  }
  return out;
}


// ---- Doelgroep (zie supabase/audience_summary.sql) ----

export interface AudienceGroup {
  label: string;
  count: number;
}

export interface AudienceSummary {
  engaged: number;
  minimum: number;
  enough: boolean;
  age: AudienceGroup[];
  gender: AudienceGroup[];
}

export async function fetchAudienceSummary(): Promise<AudienceSummary | null> {
  const { data, error } = await createClient().rpc("get_audience_summary");
  if (error) throw error;
  if (!data?.ok) return null;
  return {
    engaged: data.engaged ?? 0,
    minimum: data.minimum ?? 10,
    enough: !!data.enough,
    age: data.age ?? [],
    gender: data.gender ?? [],
  };
}
