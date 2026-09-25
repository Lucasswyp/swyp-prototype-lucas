import { algoliasearch } from "algoliasearch";

// One combined index rather than four separate ones — the search page
// already merges companies/products/rewards/ads into a single results view,
// so a `type` facet on one index matches that mental model and means one
// query instead of four.
export const SEARCH_INDEX_NAME = "swyp_search";

export function createAlgoliaWriteClient() {
  return algoliasearch(process.env.NEXT_PUBLIC_ALGOLIA_APP_ID!, process.env.ALGOLIA_WRITE_KEY!);
}

// Safe to call from the browser — this is the public, read-only Search key,
// not the Write key above.
export function createAlgoliaSearchClient() {
  return algoliasearch(process.env.NEXT_PUBLIC_ALGOLIA_APP_ID!, process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY!);
}

interface CompanyRecord {
  objectID: string;
  type: "company";
  name: string;
  category: string;
  location: string;
  description: string;
  logoUrl: string;
  bannerUrl: string;
  verified: boolean;
  followers: number;
}

interface ProductRecord {
  objectID: string;
  type: "product";
  name: string;
  description: string;
  category: string;
  price: number;
  oldPrice?: number;
  imageUrl: string;
  rating: number;
  highlights: string[];
  url?: string;
  companyId: string;
  companyName: string;
  companyLogoUrl: string;
  companyVerified: boolean;
}

interface RewardRecord {
  objectID: string;
  type: "reward";
  title: string;
  description?: string;
  category: string;
  tokenCost: number;
  moneyValue?: number;
  imageUrl: string;
  companyId: string;
  companyName: string;
  companyLogoUrl: string;
}

interface AdRecord {
  objectID: string;
  type: "ad";
  caption: string;
  category: string;
  videoUrl: string;
  posterUrl: string;
  ctaLabel: string;
  productId: string;
  companyId: string;
  companyName: string;
  companyLogoUrl: string;
  companyVerified: boolean;
}

export type SearchRecord = CompanyRecord | ProductRecord | RewardRecord | AdRecord;
