export type Category =
  | "Fashion"
  | "Food"
  | "Tech"
  | "Fitness"
  | "Travel"
  | "Beauty"
  | "Events"
  | "Gaming"
  | "Home"
  | "Cars"
  | "Restaurants"
  | "Wellness"
  | "Sports"
  | "Days Out"
  | "Entertainment";

export interface Company {
  id: string;
  name: string;
  logoUrl: string;
  bannerUrl: string;
  verified: boolean;
  category: Category;
  location: string;
  website: string;
  description: string;
  followers: number;
}

export interface Product {
  id: string;
  companyId: string;
  name: string;
  description: string;
  imageUrl: string;
  price: number;
  oldPrice?: number;
  category: Category;
  url: string;
  rating: number;
  highlights: string[];
}

export interface Ad {
  id: string;
  companyId: string;
  productId: string;
  campaignId: string;
  videoUrl: string;
  posterUrl: string;
  caption: string;
  category: Category;
  ctaLabel: string;
  rewardRules: {
    watch80: number;
    like: number;
    save: number;
    click: number;
  };
}

export type CampaignObjective =
  | "Brand awareness"
  | "Engagement"
  | "Website traffic"
  | "Sales"
  | "Store visits";

export type CampaignStatus = "Active" | "Paused" | "Draft" | "Completed";

export interface Campaign {
  id: string;
  companyId: string;
  name: string;
  objective: CampaignObjective;
  status: CampaignStatus;
  adId: string;
  dailyBudget: number;
  totalBudget: number;
  startDate: string;
  endDate: string;
  targeting: {
    ageMin: number;
    ageMax: number;
    gender: "Alle" | "Man" | "Vrouw";
    location: string;
    radiusKm: number;
    interests: Category[];
  };
  rewardRules: {
    watch80: number;
    like: number;
    save: number;
    click: number;
  };
  metrics: {
    spend: number;
    impressions: number;
    uniqueViews: number;
    completedViews: number;
    likes: number;
    saves: number;
    clicks: number;
    conversions: number;
    revenue: number;
  };
  retention: { second: number; percent: number }[];
  createdAt: string;
}

export type RewardCategory =
  | "Populair"
  | "Eten & drinken"
  | "Fashion"
  | "Dagjes uit"
  | "Travel"
  | "Entertainment"
  | "Fitness"
  | "Beauty"
  | "Tech";

export interface Reward {
  id: string;
  companyId: string;
  title: string;
  description: string;
  imageUrl: string;
  category: RewardCategory;
  tokenCost: number;
  moneyValue?: number;
  terms: string;
  stock: number;
  startDate: string;
  endDate: string;
  redemptionMethod: "code" | "qr";
}

export type RedemptionStatus = "active" | "used" | "expired";

export interface Redemption {
  id: string;
  rewardId: string;
  redeemedAt: string;
  status: RedemptionStatus;
  code: string;
}

export interface WalletTransaction {
  id: string;
  amount: number;
  reason: string;
  createdAt: string;
}

export interface Challenge {
  id: string;
  title: string;
  target: number;
  progress: number;
  rewardTokens: number;
}

export type SwypEventName =
  | "ad_impression"
  | "ad_view_25"
  | "ad_view_50"
  | "ad_view_75"
  | "ad_complete"
  | "ad_swipe_left"
  | "ad_swipe_right"
  | "ad_like"
  | "ad_save"
  | "ad_share"
  | "ad_click"
  | "product_view"
  | "company_view"
  | "company_follow"
  | "reward_view"
  | "reward_redeem"
  | "reward_use"
  | "search"
  | "campaign_created";

export interface SwypEvent {
  name: SwypEventName;
  payload?: Record<string, unknown>;
  timestamp: number;
}
