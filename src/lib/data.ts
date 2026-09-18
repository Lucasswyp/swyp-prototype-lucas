/* eslint-disable @typescript-eslint/no-explicit-any -- this module is the
   boundary layer that maps loosely-typed Supabase rows onto our strict
   internal types; the `any` params below are the raw row shape. */
import { createClient } from "@/lib/supabase/client";
import type { Company, Product, Ad, Campaign, Reward, Redemption } from "@/types";

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

function mapAd(r: any): Ad {
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
    rewardRules: { watch80: 1, like: 2, save: 3, click: 2 },
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
  const { data, error } = await supabase.from("businesses").select("*").order("created_at");
  if (error) throw error;
  return (data ?? []).map(mapCompany);
}

export async function fetchProducts(): Promise<Product[]> {
  const supabase = createClient();
  const { data, error } = await supabase.from("products").select("*").order("created_at");
  if (error) throw error;
  return (data ?? []).map(mapProduct);
}

export async function fetchAds(): Promise<Ad[]> {
  const supabase = createClient();
  const { data, error } = await supabase.from("ads").select("*").order("created_at");
  if (error) throw error;
  return (data ?? []).map(mapAd);
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
      reward_watch: c.rewardRules.watch80,
      reward_like: c.rewardRules.like,
      reward_save: c.rewardRules.save,
      reward_click: c.rewardRules.click,
    })
    .select("id")
    .single();
  if (error) throw error;

  await supabase.from("ads").update({ campaign_id: data.id }).eq("id", c.adId);
  return data.id as string;
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
  businessId?: string;
  adId?: string;
  productId?: string;
  eventName: string;
  value?: number;
}) {
  const supabase = createClient();
  await supabase.from("interactions").insert({
    device_id: event.deviceId,
    business_id: event.businessId ?? null,
    ad_id: event.adId ?? null,
    product_id: event.productId ?? null,
    event_name: event.eventName,
    value: event.value ?? null,
  });
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

export async function insertRedemption(rewardId: string, deviceId: string, code: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("redemptions")
    .insert({ reward_id: rewardId, device_id: deviceId, code })
    .select("*")
    .single();
  if (error) throw error;
  return data as Redemption & { device_id: string };
}

export async function fetchRedemptionsForDevice(deviceId: string) {
  const supabase = createClient();
  const { data, error } = await supabase.from("redemptions").select("*").eq("device_id", deviceId);
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id,
    rewardId: r.reward_id,
    redeemedAt: r.redeemed_at,
    status: r.status,
    code: r.code,
  })) as Redemption[];
}

export async function markRedemptionUsedRemote(redemptionId: string) {
  const supabase = createClient();
  const { error } = await supabase.from("redemptions").update({ status: "used" }).eq("id", redemptionId);
  if (error) throw error;
}

export interface AnalyticsTotals {
  impressions: number;
  watch80: number;
  completed: number;
  likes: number;
  saves: number;
  clicks: number;
  uniqueDevices: number;
}

export function computeAnalytics(interactions: Pick<Interaction, "event_name" | "device_id" | "ad_id">[], adId?: string): AnalyticsTotals {
  const relevant = adId ? interactions.filter((i) => i.ad_id === adId) : interactions;
  const devices = new Set(relevant.map((i) => i.device_id));
  const count = (name: string) => relevant.filter((i) => i.event_name === name).length;
  return {
    impressions: count("impression"),
    watch80: count("watch80"),
    completed: count("complete"),
    likes: count("like"),
    saves: count("save"),
    clicks: count("click"),
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
